import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, authApi } from "../lib/api";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthContextType = {
  status: AuthStatus;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [username, setUsername] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((res) => {
        if (cancelled) return;
        setUsername(res.data.username);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While an admin route is mounted, any 401 (expired/revoked session) flips
  // the state so RequireAuth redirects to login. Ejected on unmount so the
  // public site is never affected.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      if (
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
        setStatus("unauthenticated");
        setUsername(null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const res = await authApi.login(user, password);
    setUsername(res.data.username);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUsername(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
