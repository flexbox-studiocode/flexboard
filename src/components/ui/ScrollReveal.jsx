import { useEffect, useRef } from "react";

// Opt in only for secondary content. Pending reveals always remain visible.
export function ScrollReveal({ children, className = "", ...props }) {
  const nodeRef = useRef(null);
  const consumedRef = useRef(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || consumedRef.current) return;

    let observer;
    let animation;
    let media;
    let disposed = false;
    let removeMediaListener = () => {};

    const disconnect = () => observer?.disconnect();
    const cancelAnimation = () => {
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      animation = undefined;
    };
    const stop = () => {
      consumedRef.current = true;
      disconnect();
      cancelAnimation();
    };
    const onPreferenceChange = (event) => {
      if (!event.matches) stop();
    };
    const onFocus = () => stop();
    const cleanup = () => {
      disposed = true;
      disconnect();
      cancelAnimation();
      removeMediaListener();
      node.removeEventListener("focusin", onFocus);
    };

    try {
      media = window.matchMedia("(prefers-reduced-motion: no-preference)");
      if (!media.matches || node.contains(document.activeElement)) {
        consumedRef.current = true;
        return;
      }
      if (
        typeof window.IntersectionObserver !== "function" ||
        typeof node.animate !== "function"
      )
        return;
      if (node.getBoundingClientRect().top < window.innerHeight) {
        consumedRef.current = true;
        return;
      }

      node.addEventListener("focusin", onFocus);
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onPreferenceChange);
        removeMediaListener = () =>
          media.removeEventListener("change", onPreferenceChange);
      } else if (typeof media.addListener === "function") {
        media.addListener(onPreferenceChange);
        removeMediaListener = () => media.removeListener(onPreferenceChange);
      }

      observer = new window.IntersectionObserver(
        (entries) => {
          if (
            disposed ||
            consumedRef.current ||
            !entries.some(
              (entry) => entry.target === node && entry.isIntersecting,
            )
          )
            return;
          consumedRef.current = true;
          disconnect();
          if (!media.matches || node.contains(document.activeElement)) return;

          try {
            const styles = window.getComputedStyle(node);
            const durationToken = styles
              .getPropertyValue("--motion-enter")
              .trim();
            const durationValue = Number.parseFloat(durationToken);
            const duration =
              Number.isFinite(durationValue) && durationValue >= 0
                ? durationValue * (durationToken.endsWith("ms") ? 1 : 1000)
                : 220;
            const distance =
              styles.getPropertyValue("--motion-distance").trim() || "8px";
            const easing =
              styles.getPropertyValue("--motion-ease").trim() ||
              "cubic-bezier(0.2, 0, 0, 1)";
            animation = node.animate(
              [
                { opacity: 0, transform: `translateY(${distance})` },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration, easing },
            );
            animation.onfinish = () => {
              animation = undefined;
            };
          } catch {
            // Unsupported animation options must not affect static content.
            cancelAnimation();
          }
        },
        { rootMargin: "0px 0px 48px 0px" },
      );
      observer.observe(node);
    } catch {
      cleanup();
    }

    return cleanup;
  }, []);

  return (
    <div
      {...props}
      ref={nodeRef}
      className={`motion-reveal ${className}`.trim()}
    >
      {children}
    </div>
  );
}
