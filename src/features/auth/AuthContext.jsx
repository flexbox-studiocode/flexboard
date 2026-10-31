import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const AuthContext = createContext({
  status: "anonymous",
  profile: null,
  error: null,
  refresh: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    error: null,
  });
  const requestId = useRef(0);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    const previousController = controllerRef.current;
    previousController?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const requestOptions = previousController
        ? { credentials: "include", signal: controller.signal }
        : { credentials: "include" };
      const response = await fetch("/api/auth/me", requestOptions);
      if (id !== requestId.current || !mountedRef.current) return null;
      if (response.status === 401) {
        setState({ status: "anonymous", profile: null, error: null });
        return null;
      }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const body = await response.json();
      if (id !== requestId.current || !mountedRef.current) return null;
      const profile = body?.data?.user;
      if (!profile?.id || !profile.role) throw new Error("INVALID_SESSION");
      const session = {
        ...profile,
        capabilities: body.data.capabilities || {},
      };
      setState({ status: "authenticated", profile: session, error: null });
      return session;
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        id !== requestId.current ||
        !mountedRef.current
      )
        return null;
      setState({
        status: "unavailable",
        profile: null,
        error: error instanceof Error ? error.message : "SESSION_ERROR",
      });
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => refresh(), 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    const id = ++requestId.current;
    controllerRef.current?.abort();
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok && response.status !== 401)
      throw new Error(`HTTP_${response.status}`);
    if (id === requestId.current && mountedRef.current)
      setState({ status: "anonymous", profile: null, error: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, refresh, logout }),
    [state, refresh, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
