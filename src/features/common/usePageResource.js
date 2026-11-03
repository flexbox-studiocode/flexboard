import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { requestTaskApi } from "../tasks/taskApi.js";

/**
 * One controlled polling implementation for every live page.
 *
 * - `resource` (tests / composed parents) always wins and is returned untouched.
 * - Otherwise the exact current URL (pathname + query) is fetched, so filters that
 *   live in the URL always reach the server.
 * - Only one request is in flight: a newer tick aborts the older request and stale
 *   responses are dropped, so an older payload can never overwrite newer data.
 * - Polling is limited to visible tabs, refreshes on tab focus and on `online`.
 */
export function usePageResource(resource, path, adapt, { interval = 5000, live = true } = {}) {
  const { pathname, search } = useLocation();
  const scope = `${pathname}${search}`;
  const [state, setState] = useState({ status: "loading", scope });
  const tick = useRef(0);
  const controller = useRef(null);
  const adaptRef = useRef(adapt);
  useEffect(() => { adaptRef.current = adapt; }, [adapt]);

  const load = useCallback(async (showLoading) => {
    const id = ++tick.current;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    if (showLoading) setState({ status: "loading", scope });
    try {
      const data = await requestTaskApi(`${path}${search}`, { signal: next.signal });
      if (id !== tick.current) return;
      setState({ status: "success", scope, items: adaptRef.current(data) });
    } catch (error) {
      if (error?.name === "AbortError" || id !== tick.current) return;
      setState({ status: "error", scope });
    }
  }, [path, search, scope]);

  useEffect(() => {
    if (resource !== undefined) return undefined;
    // The initial request synchronizes external API state with this page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(true);
    if (!live) return undefined;
    const poll = () => { if (document.visibilityState !== "hidden") load(false); };
    const timer = window.setInterval(poll, interval);
    const resume = () => { if (document.visibilityState === "visible") load(false); };
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
      controller.current?.abort();
      tick.current += 1;
    };
  }, [resource, load, interval, live]);

  return resource !== undefined ? resource : state;
}
