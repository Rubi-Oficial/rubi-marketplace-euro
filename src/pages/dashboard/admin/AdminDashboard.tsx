import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Users, Shield, CreditCard, DollarSign, AlertTriangle, TrendingUp,
  BarChart3, Clock, Mail, UserPlus, CheckCircle2, XCircle, Banknote,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number; activeProfiles: number; pendingProfiles: number;
  activeSubs: number; problemSubs: number; canceledSubs: number; pendingSubs: number;
  pendingCommissions: number; approvedCommissions: number; paidCommissions: number;
  gmv: number; totalLeads: number; supplyDemandRatio: string;
  unreadMessages: number; totalMessages: number;
  signups7d: number; signups30d: number; payments7d: number; payments30d: number;
  topAffiliates: { name: string; code: string; clicks: number; conversions: number; commission: number }[];
  recentActions: { id: string; action_type: string; created_at: string; admin_name: string }[];
}

interface SanityChecks {
  usersWithoutRole: number; orphanProfiles: number; activeSubsNoStripe: number;
  conversionsZeroCommission: number; selfReferrals: number; pendingSubsOld: number;
  professionalsWithoutProfile: number;
}

const fmt = (v: number) => v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" });

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sanity, setSanity] = useState<SanityChecks | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      const [rpcRes, sanityRes, actionsRes] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats" as any),
        supabase.rpc("get_admin_sanity_checks" as any),
        supabase.from("admin_actions")
          .select("id, action_type, created_at, users!admin_actions_admin_user_id_fkey(full_name)")
          .order("created_at", { ascending: false }).limit(10),
      ]);

      const d = (rpcRes.data as any) || {};
      const supply = d.active_profiles ?? 0;
      const demand = d.total_clients ?? 0;
      const ratio = demand > 0 ? (supply / demand).toFixed(2) : "—";

      setStats({
        totalUsers: d.total_users ?? 0, activeProfiles: supply, pendingProfiles: d.pending_profiles ?? 0,
        activeSubs: d.active_subs ?? 0, problemSubs: d.problem_subs ?? 0,
        canceledSubs: d.canceled_subs ?? 0, pendingSubs: d.pending_subs ?? 0,
        pendingCommissions: Number(d.pending_commissions ?? 0),
        approvedCommissions: Number(d.approved_commissions ?? 0),
        paidCommissions: Number(d.paid_commissions ?? 0),
        gmv: Number(d.gmv ?? 0), totalLeads: d.total_leads ?? 0, supplyDemandRatio: ratio,
        unreadMessages: d.unread_messages ?? 0, totalMessages: d.total_messages ?? 0,
        signups7d: d.signups_7d ?? 0, signups30d: d.signups_30d ?? 0,
        payments7d: d.payments_7d ?? 0, payments30d: d.payments_30d ?? 0,
        topAffiliates: (d.top_affiliates || []).map((a: any) => ({
          name: a.name || "—", code: a.code || "", clicks: a.clicks ?? 0,
          conversions: a.conversions ?? 0, commission: Number(a.commission ?? 0),
        })),
        recentActions: (actionsRes.data || []).map((a: any) => ({
          id: a.id, action_type: a.action_type, created_at: a.created_at,
          admin_name: a.users?.full_name || "Admin",
        })),
      });

      const s = (sanityRes.data as any) || {};
      setSanity({
        usersWithoutRole: s.users_without_role ?? 0, orphanProfiles: s.orphan_profiles ?? 0,
        activeSubsNoStripe: s.active_subs_no_stripe ?? 0, conversionsZeroCommission: s.conversions_zero_commission ?? 0,
        selfReferrals: s.self_referrals ?? 0, pendingSubsOld: s.pending_subs_old ?? 0,
        professionalsWithoutProfile: s.professionals_without_profile ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const formatAction = (type: string): string => t(`action.${type}`) !== `action.${type}` ? t(`action.${type}`) : type;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div><Skeleton className="h-8 w-64" /><Skeleton className="mt-2 h-4 w-40" /></div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      </div>
    );
  }

  if (!stats) return null;

  const funnelRate = stats.signups30d > 0 ? ((stats.payments30d / stats.signups30d) * 100).toFixed(1) : "0";
  const sanityIssues = sanity ? Object.values(sanity).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.overview")}</p>
      </div>

      {sanity && sanityIssues > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm font-semibold text-destructive">{sanityIssues} {t("admin.inconsistencies")}</p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {sanity.usersWithoutRole > 0 && <SanityItem count={sanity.usersWithoutRole} label={t("sanity.users_no_role")} />}
            {sanity.orphanProfiles > 0 && <SanityItem count={sanity.orphanProfiles} label={t("sanity.orphan_profiles")} />}
            {sanity.activeSubsNoStripe > 0 && <SanityItem count={sanity.activeSubsNoStripe} label={t("sanity.active_no_stripe")} />}
            {sanity.conversionsZeroCommission > 0 && <SanityItem count={sanity.conversionsZeroCommission} label={t("sanity.zero_commission")} />}
            {sanity.selfReferrals > 0 && <SanityItem count={sanity.selfReferrals} label={t("sanity.self_referrals")} />}
            {sanity.pendingSubsOld > 0 && <SanityItem count={sanity.pendingSubsOld} label={t("sanity.pending_old")} />}
            {sanity.professionalsWithoutProfile > 0 && <SanityItem count={sanity.professionalsWithoutProfile} label={t("sanity.no_profile")} />}
          </div>
        </div>
      )}

      <Section title={t("admin.revenue_subs")}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<DollarSign className="h-4 w-4" />} label={t("admin.gmv")} value={fmt(stats.gmv)} />
          <MetricCard icon={<CreditCard className="h-4 w-4" />} label={t("admin.active_subs")} value={stats.activeSubs.toString()} />
          <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label={t("admin.problem_payments")} value={stats.problemSubs.toString()} highlight={stats.problemSubs > 0} />
          <MetricCard icon={<XCircle className="h-4 w-4" />} label={t("admin.canceled_pending")} value={`${stats.canceledSubs} / ${stats.pendingSubs}`} />
        </div>
      </Section>

      <Section title={t("admin.growth_funnel")}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<UserPlus className="h-4 w-4" />} label={t("admin.signups_period")} value={`${stats.signups7d} / ${stats.signups30d}`} />
          <MetricCard icon={<CreditCard className="h-4 w-4" />} label={t("admin.payments_period")} value={`${stats.payments7d} / ${stats.payments30d}`} />
          <MetricCard icon={<TrendingUp className="h-4 w-4" />} label={t("admin.conversion_30d")} value={`${funnelRate}%`} />
          <MetricCard icon={<BarChart3 className="h-4 w-4" />} label={t("admin.total_leads")} value={stats.totalLeads.toString()} />
        </div>
      </Section>

      <Section title={t("admin.profiles_ops")}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Users className="h-4 w-4" />} label={t("admin.active_profiles")} value={stats.activeProfiles.toString()} />
          <MetricCard icon={<Shield className="h-4 w-4" />} label={t("admin.pending_profiles")} value={stats.pendingProfiles.toString()} highlight={stats.pendingProfiles > 0} />
          <MetricCard icon={<Mail className="h-4 w-4" />} label={t("admin.unread_messages")} value={stats.unreadMessages.toString()} highlight={stats.unreadMessages > 0} />
          <MetricCard icon={<Users className="h-4 w-4" />} label={t("admin.total_users")} value={stats.totalUsers.toString()} />
        </div>
      </Section>

      <Section title={t("admin.affiliate_commissions")}>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <CommissionCard icon={<Clock className="h-4 w-4" />} label={t("admin.commission_pending")} value={fmt(stats.pendingCommissions)} variant="pending" />
          <CommissionCard icon={<CheckCircle2 className="h-4 w-4" />} label={t("admin.commission_approved")} value={fmt(stats.approvedCommissions)} variant="approved" />
          <CommissionCard icon={<Banknote className="h-4 w-4" />} label={t("admin.commission_paid")} value={fmt(stats.paidCommissions)} variant="paid" />
        </div>
      </Section>

      <div className="flex flex-col gap-3">
        {stats.pendingProfiles > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-sm text-foreground font-medium">{t("admin.profiles_awaiting", { count: stats.pendingProfiles.toString() })}</p>
            <Link to="/admin/perfis/pendentes" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">{t("admin.moderate_now")}</Link>
          </div>
        )}
        {stats.unreadMessages > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-sm text-foreground font-medium">{t("admin.unread_contact", { count: stats.unreadMessages.toString() })}</p>
            <Link to="/admin/mensagens" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">{t("admin.view_messages")}</Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("admin.top_affiliates")}</h2>
          {stats.topAffiliates.length === 0 ? (
            <EmptyState message={t("admin.no_affiliates")} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-4">{t("admin.name")}</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-4">{t("admin.clicks")}</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-4">{t("admin.conversions")}</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-4">{t("admin.commission")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topAffiliates.map((a, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 text-foreground sm:px-4">{a.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground sm:px-4">{a.clicks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground sm:px-4">{a.conversions}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground sm:px-4">{fmt(a.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("admin.recent_actions")}</h2>
          {stats.recentActions.length === 0 ? (
            <EmptyState message={t("admin.no_actions")} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-4">{t("admin.action")}</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-4">{t("admin.admin_col")}</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-4">{t("admin.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActions.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 text-foreground sm:px-4">{formatAction(a.action_type)}</td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-4">{a.admin_name}</td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground sm:px-4">{fmtDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>{children}</div>;
}

function MetricCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 sm:p-5 ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-xs sm:text-sm leading-tight">{label}</p></div>
      <p className={`mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function CommissionCard({ icon, label, value, variant }: { icon: React.ReactNode; label: string; value: string; variant: "pending" | "approved" | "paid" }) {
  const borderStyles = { pending: "border-yellow-500/20", approved: "border-primary/20", paid: "border-green-500/20" };
  const valueStyles = { pending: "text-foreground", approved: "text-primary", paid: "text-green-500" };
  return (
    <div className={`rounded-lg border bg-card p-4 sm:p-5 ${borderStyles[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-xs font-medium uppercase tracking-wider">{label}</p></div>
      <p className={`mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums ${valueStyles[variant]}`}>{value}</p>
    </div>
  );
}

function SanityItem({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/5 px-3 py-1.5">
      <span className="mt-px inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground leading-5">{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">{message}</div>;
}
