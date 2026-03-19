import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Shield,
  CreditCard,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeProfiles: number;
  pendingProfiles: number;
  activeSubs: number;
  problemSubs: number;
  pendingCommissions: number;
  gmv: number;
  totalLeads: number;
  supplyDemandRatio: string;
  topAffiliates: { name: string; code: string; clicks: number; conversions: number; commission: number }[];
  recentActions: { id: string; action_type: string; created_at: string; admin_name: string }[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        usersRes,
        activeProfilesRes,
        pendingProfilesRes,
        activeSubsRes,
        problemSubsRes,
        pendingCommRes,
        allSubsRes,
        leadsRes,
        clientsRes,
        actionsRes,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["past_due", "expired"]),
        supabase.from("referral_conversions").select("commission_amount").eq("status", "pending"),
        supabase.from("subscriptions").select("plans(price)").eq("status", "active"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("admin_actions").select("id, action_type, created_at, users!admin_actions_admin_user_id_fkey(full_name)")
          .order("created_at", { ascending: false }).limit(10),
      ]);

      // GMV from active subscriptions
      const gmv = (allSubsRes.data || []).reduce((s, sub: any) => s + Number(sub.plans?.price || 0), 0);

      // Pending commissions total
      const pendingComm = (pendingCommRes.data || []).reduce((s, c: any) => s + Number(c.commission_amount), 0);

      // Supply/demand ratio
      const supply = activeProfilesRes.count ?? 0;
      const demand = clientsRes.count ?? 0;
      const ratio = demand > 0 ? (supply / demand).toFixed(2) : "—";

      // Top affiliates - fetch users with referral codes, then get their stats
      const { data: affiliateUsers } = await supabase.from("users")
        .select("id, full_name, referral_code")
        .not("referral_code", "is", null).limit(50);

      const topAffiliates: AdminStats["topAffiliates"] = [];
      if (affiliateUsers) {
        for (const u of affiliateUsers) {
          const [clicksRes, convRes] = await Promise.all([
            supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", u.id),
            supabase.from("referral_conversions").select("commission_amount, status").eq("referrer_user_id", u.id),
          ]);
          const conversions = convRes.data || [];
          const totalComm = conversions.reduce((s, c) => s + Number(c.commission_amount), 0);
          topAffiliates.push({
            name: u.full_name || "—",
            code: u.referral_code || "",
            clicks: clicksRes.count ?? 0,
            conversions: conversions.length,
            commission: totalComm,
          });
        }
        topAffiliates.sort((a, b) => b.commission - a.commission);
      }

      setStats({
        totalUsers: usersRes.count ?? 0,
        activeProfiles: supply,
        pendingProfiles: pendingProfilesRes.count ?? 0,
        activeSubs: activeSubsRes.count ?? 0,
        problemSubs: problemSubsRes.count ?? 0,
        pendingCommissions: pendingComm,
        gmv,
        totalLeads: leadsRes.count ?? 0,
        supplyDemandRatio: ratio,
        topAffiliates: topAffiliates.slice(0, 5),
        recentActions: (actionsRes.data || []).map((a: any) => ({
          id: a.id,
          action_type: a.action_type,
          created_at: a.created_at,
          admin_name: a.users?.full_name || "Admin",
        })),
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<DollarSign className="h-4 w-4" />} label="GMV (Assinaturas Ativas)" value={fmt(stats.gmv)} />
        <MetricCard icon={<CreditCard className="h-4 w-4" />} label="Assinaturas Ativas" value={stats.activeSubs.toString()} />
        <MetricCard icon={<Shield className="h-4 w-4" />} label="Perfis Pendentes" value={stats.pendingProfiles.toString()} highlight={stats.pendingProfiles > 0} />
        <MetricCard icon={<Users className="h-4 w-4" />} label="Perfis Ativos" value={stats.activeProfiles.toString()} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Pagamentos com Problema" value={stats.problemSubs.toString()} highlight={stats.problemSubs > 0} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Comissões Pendentes" value={fmt(stats.pendingCommissions)} />
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Supply/Demand Ratio" value={stats.supplyDemandRatio} />
        <MetricCard icon={<BarChart3 className="h-4 w-4" />} label="Leads Totais" value={stats.totalLeads.toString()} />
      </div>

      {/* Quick access */}
      {stats.pendingProfiles > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
          <p className="text-sm text-foreground font-medium">
            {stats.pendingProfiles} perfil(is) aguardando moderação
          </p>
          <Link to="/admin/perfis/pendentes" className="text-sm font-medium text-primary hover:underline">
            Moderar agora →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top affiliates */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Top Afiliados</h2>
          {stats.topAffiliates.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum afiliado registrado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cliques</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Conv.</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topAffiliates.map((a, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{a.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{a.clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{a.conversions}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(a.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent admin actions */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ações Recentes</h2>
          {stats.recentActions.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhuma ação registrada.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActions.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{formatAction(a.action_type)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.admin_name}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("pt-BR")}
                      </td>
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

function MetricCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-5 ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function formatAction(type: string): string {
  const map: Record<string, string> = {
    profile_approved: "Perfil aprovado",
    profile_rejected: "Perfil rejeitado",
    profile_paused: "Perfil pausado",
    profile_featured: "Perfil destacado",
    profile_unfeatured: "Destaque removido",
    image_approved: "Foto aprovada",
    image_rejected: "Foto rejeitada",
    commission_approved: "Comissão aprovada",
    commission_rejected: "Comissão rejeitada",
    plan_created: "Plano criado",
    plan_updated: "Plano atualizado",
  };
  return map[type] || type;
}
