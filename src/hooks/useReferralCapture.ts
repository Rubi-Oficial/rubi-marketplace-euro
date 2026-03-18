import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const REFERRAL_KEY = "aura_ref";

/**
 * Captures ?ref=CODE from URL, stores in sessionStorage,
 * and records a click in referral_clicks.
 */
export function useReferralCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // Already captured this code in this session
    const existing = sessionStorage.getItem(REFERRAL_KEY);
    if (existing === ref) return;

    sessionStorage.setItem(REFERRAL_KEY, ref);

    // Look up referrer via secure RPC (no direct user table access needed)
    (async () => {
      const { data: referrerId } = await supabase.rpc("get_referrer_id_by_code", { _code: ref });

      if (!referrerId) return;

      await supabase.from("referral_clicks").insert({
        referrer_user_id: referrer.id,
        referral_code: ref,
        visitor_id: crypto.randomUUID(),
        landing_page: window.location.pathname,
        utm_source: searchParams.get("utm_source") || null,
        utm_campaign: searchParams.get("utm_campaign") || null,
        user_agent: navigator.userAgent,
      });
    })();
  }, [searchParams]);
}

/** Returns the stored referral code (if any) for use during signup. */
export function getStoredReferralCode(): string | null {
  return sessionStorage.getItem(REFERRAL_KEY);
}
