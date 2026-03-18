import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";

/**
 * Handles post-OAuth redirect: when user lands on "/" after Google login,
 * redirects them to the correct dashboard based on their role.
 */
export default function AuthRedirectHandler() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only act after auth is resolved and we have a logged-in user with role
    if (loading || !user || !userRole) return;

    // Check if this looks like a post-OAuth redirect (hash contains access_token)
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=signup") || hash.includes("type=magiclink")) {
      const target = getRoleDashboard(userRole as any);
      navigate(target, { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  return null;
}
