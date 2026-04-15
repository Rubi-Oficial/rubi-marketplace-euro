import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { consumeOAuthPreState } from "@/lib/oauthState";
import { supabase } from "@/integrations/supabase/client";

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
          const { data: currentUser, error: fetchError } = await supabase
            .from("users")
            .select("referred_by_user_id")
            .eq("id", user.id)
            .single();

          if (fetchError) {
            console.error("[auth-redirect] Failed to fetch user:", fetchError.message);
          } else if (!currentUser?.referred_by_user_id) {
            const { data: referrerId, error: rpcError } = await supabase.rpc(
              "get_referrer_id_by_code",
              { _code: preState.referral_code }
            );
            if (rpcError) {
              console.error("[auth-redirect] RPC error:", rpcError.message);
            } else if (referrerId && referrerId !== user.id) {
              updates.referred_by_user_id = referrerId;
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase.from("users").update(updates).eq("id", user.id);
          if (updateError) {
            console.error("[auth-redirect] Failed to update user:", updateError.message);
          }
        }

        // Create profile for professional if needed
        if (preState.role === "professional") {
          const { data: existingProfile, error: profileFetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileFetchError) {
            console.error("[auth-redirect] Failed to check existing profile:", profileFetchError.message);
          } else if (!existingProfile) {
            const { error: insertError } = await supabase.from("profiles").insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || "",
              status: "draft",
            });
            if (insertError) {
              console.error("[auth-redirect] Failed to create profile:", insertError.message);
            }
          }
        }

        // Redirect based on intended role
        const targetRole = preState.role || userRole;
        const target = getRoleDashboard(targetRole);
        if (targetRole === "professional") {
          navigate("/app/onboarding", { replace: true });
        } else {
          navigate(target, { replace: true });
        }
      } else {
        // No pre-state — standard redirect
        const target = getRoleDashboard(userRole);
        navigate(target, { replace: true });
      }
    })().catch((err: unknown) => {
      console.error("[auth-redirect] Unexpected error:", err);
      // Fall back to safe redirect
      navigate(getRoleDashboard(userRole), { replace: true });
    });
  }, [user, userRole, loading, navigate]);

  return null;
}
