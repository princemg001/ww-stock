import type { SessionInfo, UserRole } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const SESSION_KEY = "ww_stock_session";

interface AuthContextValue {
  session: SessionInfo | null;
  login: (session: SessionInfo) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): SessionInfo | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionInfo;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(loadSession);

  const login = useCallback((s: SessionInfo) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAdmin: session?.role === "admin" || session?.role === "owner",
        isAuthenticated: session !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useRequireAuth(): SessionInfo {
  const { session } = useAuth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export function useRequireRole(role: UserRole): SessionInfo {
  const session = useRequireAuth();
  if (session.role !== role) throw new Error(`Requires ${role} role`);
  return session;
}
