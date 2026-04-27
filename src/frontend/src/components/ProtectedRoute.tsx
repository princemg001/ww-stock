import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { Navigate } from "@tanstack/react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, session } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/home" />;
  }

  if (session) {
    return <>{children}</>;
  }

  return <Navigate to="/" />;
}
