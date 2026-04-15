import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Users, Shield, CreditCard, DollarSign, AlertTriangle, TrendingUp,
  BarChart3, Clock, Mail, UserPlus, CheckCircle2, XCircle, Banknote,
  ArrowUpRight, Activity,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

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

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sanity, setSanity] = useState<SanityChecks | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      try {
        const [rpcRes, sanityRes, actionsRes] = await Promise.all([
          supabase.rpc("get_admin_dashboard_stats" as any),
          supabase.rpc("get_admin_sanity_checks" as any),
          supabase.from("admin_actions")
            .select("id, action_type, created_at, users!admin_actions_admin_user_id_fkey(full_name)")
            .order("created_at", { ascending: false }).limit(10),
        ]);

        if (rpcRes.error) {
          console.error("[AdminDashboard] Stats RPC error:", rpcRes.error.message);
          toast.error("Não foi possível carregar as estatísticas.");
          setLoading(false);
          return;
        }

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
      } catch (err) {
        console.error("[AdminDashboard] Unexpected error:", err);
        toast.error("Ocorreu um erro ao carregar o painel.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatAction = (type: string): string => t(`action.${type}`) !== `action.${type}` ? t(`action.${type}`) : type;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const funnelRate = stats.signups30d > 0 ? ((stats.payments30d / stats.signups30d) * 100).toFixed(1) : "0";
  const sanityIssues = sanity ? Object.values(sanity).reduce((a, b) => a + b, 0) : 0;

  // Chart data
  const growthData = [
    { name: "7d", signups: stats.signups7d, payments: stats.payments7d },
    { name: "30d", signups: stats.signups30d, payments: stats.payments30d },
  ];

  const subsData = [
    { name: t("admin.active_subs"), value: stats.activeSubs },
    { name: t("admin.canceled_pending"), value: stats.canceledSubs + stats.pendingSubs },
    { name: t("admin.problem_payments"), value: stats.problemSubs },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            {t("admin.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("admin.overview")}</p>
        </div>
        {sanity && sanityIssues > 0 && (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            {sanityIssues} {t("admin.inconsistencies")}
          </Badge>
        )}
      </div>

      {/* Sanity Alert */}
      {sanity && sanityIssues > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {sanity.usersWithoutRole > 0 && <SanityItem count={sanity.usersWithoutRole} label={t("sanity.users_no_role")} />}
              {sanity.orphanProfiles > 0 && <SanityItem count={sanity.orphanProfiles} label={t("sanity.orphan_profiles")} />}
              {sanity.activeSubsNoStripe > 0 && <SanityItem count={sanity.activeSubsNoStripe} label={t("sanity.active_no_stripe")} />}
              {sanity.conversionsZeroCommission > 0 && <SanityItem count={sanity.conversionsZeroCommission} label={t("sanity.zero_commission")} />}
              {sanity.selfReferrals > 0 && <SanityItem count={sanity.selfReferrals} label={t("sanity.self_referrals")} />}
              {sanity.pendingSubsOld > 0 && <SanityItem count={sanity.pendingSubsOld} label={t("sanity.pending_old")} />}
              {sanity.professionalsWithoutProfile > 0 && <SanityItem count={sanity.professionalsWithoutProfile} label={t("sanity.no_profile")} />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KPICard icon={<DollarSign />} label="GMV" value={fmt(stats.gmv)} trend={`${stats.activeSubs} subs`} />
        <KPICard icon={<Users />} label={t("admin.total_users")} value={stats.totalUsers.toString()} trend={`+${stats.signups7d} (7d)`} />
        <KPICard icon={<Shield />} label={t("admin.pending_profiles")} value={stats.pendingProfiles.toString()} highlight={stats.pendingProfiles > 0} />
        <KPICard icon={<Mail />} label={t("admin.unread_messages")} value={stats.unreadMessages.toString()} highlight={stats.unreadMessages > 0} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.growth_funnel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{funnelRate}%</p>
                <p className="text-xs text-muted-foreground">{t("admin.conversion_30d")}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm tabular-nums text-foreground">{stats.totalLeads}</p>
                <p className="text-xs text-muted-foreground">{t("admin.total_leads")}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={growthData} barGap={4}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="signups" name="Signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payments" name="Payments" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.revenue_subs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={subsData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                      {subsData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                <LegendDot color={PIE_COLORS[0]} label={t("admin.active_subs")} value={stats.activeSubs} />
                <LegendDot color={PIE_COLORS[1]} label="Cancel./Pend." value={stats.canceledSubs + stats.pendingSubs} />
                {stats.problemSubs > 0 && <LegendDot color={PIE_COLORS[2]} label={t("admin.problem_payments")} value={stats.problemSubs} />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <CommissionCard icon={<Clock className="h-4 w-4" />} label={t("admin.commission_pending")} value={fmt(stats.pendingCommissions)} variant="pending" />
        <CommissionCard icon={<CheckCircle2 className="h-4 w-4" />} label={t("admin.commission_approved")} value={fmt(stats.approvedCommissions)} variant="approved" />
        <CommissionCard icon={<Banknote className="h-4 w-4" />} label={t("admin.commission_paid")} value={fmt(stats.paidCommissions)} variant="paid" />
      </div>

      {/* Action Banners */}
      {(stats.pendingProfiles > 0 || stats.unreadMessages > 0) && (
        <div className="flex flex-col gap-2">
          {stats.pendingProfiles > 0 && (
            <Link to="/admin/perfis/pendentes" className="group flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("admin.profiles_awaiting", { count: stats.pendingProfiles.toString() })}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary opacity-0 transition group-hover:opacity-100" />
            </Link>
          )}
          {stats.unreadMessages > 0 && (
            <Link to="/admin/mensagens" className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("admin.unread_contact", { count: stats.unreadMessages.toString() })}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </Link>
          )}
        </div>
      )}

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("admin.top_affiliates")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topAffiliates.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">{t("admin.no_affiliates")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.name")}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.clicks")}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.conversions")}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.commission")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topAffiliates.map((a, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{a.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{a.clicks}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{a.conversions}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">{fmt(a.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("admin.recent_actions")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentActions.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">{t("admin.no_actions")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.action")}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.admin_col")}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActions.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-foreground">{formatAction(a.action_type)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.admin_name}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDate(a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ───── Sub-components ───── */

function KPICard({ icon, label, value, trend, highlight }: { icon: React.ReactNode; label: string; value: string; trend?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/40 shadow-sm" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {icon && <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          </div>
          {trend && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{trend}</span>}
        </div>
        <p className={`mt-3 font-display text-2xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function CommissionCard({ icon, label, value, variant }: { icon: React.ReactNode; label: string; value: string; variant: "pending" | "approved" | "paid" }) {
  const styles = {
    pending: { border: "border-yellow-500/20", bg: "bg-yellow-500/5", icon: "bg-yellow-500/10 text-yellow-600", value: "text-foreground" },
    approved: { border: "border-primary/20", bg: "bg-primary/5", icon: "bg-primary/10 text-primary", value: "text-primary" },
    paid: { border: "border-green-500/20", bg: "bg-green-500/5", icon: "bg-green-500/10 text-green-600", value: "text-green-600" },
  };
  const s = styles[variant];
  return (
    <Card className={`${s.border} ${s.bg}`}>
      <CardContent className="p-4">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.icon}`}>{icon}</div>
        <p className={`mt-2 font-display text-xl font-bold tabular-nums ${s.value}`}>{value}</p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function SanityItem({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md px-2.5 py-1.5">
      <span className="mt-px inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground leading-5">{label}</span>
    </div>
  );
}
