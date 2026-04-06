import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated → redirect to login with return path
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Authenticated but role not yet loaded → keep loading
  if (!userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Authenticated but wrong role → redirect to correct dashboard
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const correctPath = getRoleDashboard(userRole);
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}
