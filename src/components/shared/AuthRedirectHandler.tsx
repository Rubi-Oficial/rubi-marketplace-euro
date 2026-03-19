import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { consumeOAuthPreState } from "@/lib/oauthState";
import { supabase } from "@/lib/supabase";

/**
 * Handles post-OAuth redirect: syncs role/referral from pre-OAuth state
 * and redirects the user to the correct dashboard.
 */
export default function AuthRedirectHandler() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || !user || !userRole || handled.current) return;

    const hash = window.location.hash;
    const isOAuthReturn =
      hash.includes("access_token") ||
      hash.includes("type=signup") ||
      hash.includes("type=magiclink");

    if (!isOAuthReturn) return;
    handled.current = true;

    const preState = consumeOAuthPreState();

    (async () => {
      if (preState) {
        const updates: Record<string, unknown> = {};

        // Sync role if different from what trigger defaulted to
        if (preState.role && preState.role !== userRole) {
          updates.role = preState.role;
        }

        // Sync referral if present and not yet set
        if (preState.referral_code) {
          const { data: currentUser } = await supabase
            .from("users")
            .select("referred_by_user_id")
            .eq("id", user.id)
            .single();

          if (!currentUser?.referred_by_user_id) {
            const { data: referrerId } = await supabase.rpc(
              "get_referrer_id_by_code",
              { _code: preState.referral_code }
            );
            if (referrerId && referrerId !== user.id) {
              updates.referred_by_user_id = referrerId;
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("users").update(updates).eq("id", user.id);
        }

        // Create profile for professional if needed
        if (preState.role === "professional") {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("profiles").insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || "",
              status: "draft",
            });
          }
        }

        // Redirect based on intended role
        const targetRole = preState.role || userRole;
        const target = getRoleDashboard(targetRole as any);
        if (targetRole === "professional") {
          navigate("/app/onboarding", { replace: true });
        } else {
          navigate(target, { replace: true });
        }
      } else {
        // No pre-state — standard redirect
        const target = getRoleDashboard(userRole as any);
        navigate(target, { replace: true });
      }
    })();
  }, [user, userRole, loading, navigate]);

  return null;
}
