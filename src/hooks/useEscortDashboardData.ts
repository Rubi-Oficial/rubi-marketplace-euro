import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  id: string;
  slug?: string | null;
  display_name?: string | null;
  status?: string | null;
  city?: string | null;
  category?: string | null;
  highlight_tier?: string | null;
  highlight_expires_at?: string | null;
  [key: string]: unknown;
}

interface SubscriptionRow {
  status: string;
  expires_at: string | null;
  plans: { name: string } | null;
}

export interface DashboardData {
  profile: ProfileData | null;
  photoStats: { approved: number; pending: number; total: number };
  subStatus: string | null;
  subPlanName: string | null;
  subExpiresAt: string | null;
  leads: number;
  referralCode: string | null;
  clicks: number;
  signups: number;
  commissionPending: number;
  commissionApproved: number;
  loading: boolean;
}

/**
 * Hook that fetches all data needed by the escort dashboard.
 */
export function useEscortDashboardData(): DashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<DashboardData, "loading">>({
    profile: null,
    photoStats: { approved: 0, pending: 0, total: 0 },
    subStatus: null, subPlanName: null, subExpiresAt: null,
    leads: 0, referralCode: null, clicks: 0, signups: 0,
    commissionPending: 0, commissionApproved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      try {
        const uid = user.id;

        const [profileRes, subsRes, userRes, clicksRes, signupsRes, convRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
          supabase.from("subscriptions").select("status, expires_at, plans:plan_id(name)").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
          supabase.from("users").select("referral_code").eq("id", uid).single(),
          supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", uid),
          supabase.rpc("get_my_referrals"),
          supabase.from("referral_conversions").select("commission_amount, status").eq("referrer_user_id", uid),
        ]);

        const profile = profileRes.data as ProfileData | null;
        let photoStats = { approved: 0, pending: 0, total: 0 };
        let leads = 0;
        if (profile) {
          const [imgRes, leadRes] = await Promise.all([
            supabase.from("profile_images").select("moderation_status").eq("profile_id", profile.id),
            supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
          ]);
          const imgs = imgRes.data ?? [];
          photoStats = {
            approved: imgs.filter((i: any) => i.moderation_status === "approved").length,
            pending: imgs.filter((i: any) => i.moderation_status === "pending").length,
            total: imgs.length,
          };
          leads = leadRes.count ?? 0;
        }

        const sub = (subsRes.data as unknown as SubscriptionRow[] | null)?.[0] ?? null;
        const convRows = (convRes.data ?? []) as { commission_amount: number; status: string }[];
        const commissionPending = convRows.filter(c => c.status === "pending").reduce((s, c) => s + c.commission_amount, 0);
        const commissionApproved = convRows.filter(c => c.status === "approved" || c.status === "paid").reduce((s, c) => s + c.commission_amount, 0);

        setData({
          profile,
          photoStats,
          subStatus: sub?.status ?? null,
          subPlanName: (sub?.plans as any)?.name ?? null,
          subExpiresAt: sub?.expires_at ?? null,
          leads,
          referralCode: userRes.data?.referral_code ?? null,
          clicks: clicksRes.count ?? 0,
          signups: (signupsRes.data ?? []).length,
          commissionPending,
          commissionApproved,
        });
      } catch (err) {
        console.error("[useEscortDashboardData]", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return { ...data, loading };
}
