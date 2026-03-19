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
  Mail,
  UserPlus,
  CheckCircle2,
  XCircle,
  Banknote,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeProfiles: number;
  pendingProfiles: number;
  activeSubs: number;
  problemSubs: number;
  canceledSubs: number;
  pendingSubs: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  gmv: number;
  totalLeads: number;
  supplyDemandRatio: string;
  unreadMessages: number;
  totalMessages: number;
  signups7d: number;
  signups30d: number;
  payments7d: number;
  payments30d: number;
  topAffiliates: { name: string; code: string; clicks: number; conversions: number; commission: number }[];
  recentActions: { id: string; action_type: string; created_at: string; admin_name: string }[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [rpcRes, actionsRes] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats" as any),
        supabase
          .from("admin_actions")
          .select("id, action_type, created_at, users!admin_actions_admin_user_id_fkey(full_name)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const d = (rpcRes.data as any) || {};
      const supply = d.active_profiles ?? 0;
      const demand = d.total_clients ?? 0;
      const ratio = demand > 0 ? (supply / demand).toFixed(2) : "—";

      setStats({
        totalUsers: d.total_users ?? 0,
        activeProfiles: supply,
        pendingProfiles: d.pending_profiles ?? 0,
        activeSubs: d.active_subs ?? 0,
        problemSubs: d.problem_subs ?? 0,
        canceledSubs: d.canceled_subs ?? 0,
        pendingSubs: d.pending_subs ?? 0,
        pendingCommissions: Number(d.pending_commissions ?? 0),
        approvedCommissions: Number(d.approved_commissions ?? 0),
        paidCommissions: Number(d.paid_commissions ?? 0),
        gmv: Number(d.gmv ?? 0),
        totalLeads: d.total_leads ?? 0,
        supplyDemandRatio: ratio,
        unreadMessages: d.unread_messages ?? 0,
        totalMessages: d.total_messages ?? 0,
        signups7d: d.signups_7d ?? 0,
        signups30d: d.signups_30d ?? 0,
        payments7d: d.payments_7d ?? 0,
        payments30d: d.payments_30d ?? 0,
        topAffiliates: (d.top_affiliates || []).map((a: any) => ({
          name: a.name || "—",
          code: a.code || "",
          clicks: a.clicks ?? 0,
          conversions: a.conversions ?? 0,
          commission: Number(a.commission ?? 0),
        })),
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

  const funnelRate = stats.signups30d > 0
    ? ((stats.payments30d / stats.signups30d) * 100).toFixed(1)
    : "0";

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>
      </div>

      {/* Revenue & subscriptions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receita & Assinaturas</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<DollarSign className="h-4 w-4" />} label="GMV (Ativas)" value={fmt(stats.gmv)} />
          <MetricCard icon={<CreditCard className="h-4 w-4" />} label="Assinaturas Ativas" value={stats.activeSubs.toString()} />
          <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Pagamentos com Problema" value={stats.problemSubs.toString()} highlight={stats.problemSubs > 0} />
          <MetricCard icon={<XCircle className="h-4 w-4" />} label="Canceladas / Pendentes" value={`${stats.canceledSubs} / ${stats.pendingSubs}`} />
        </div>
      </div>

      {/* Growth & funnel */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Crescimento & Funil</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<UserPlus className="h-4 w-4" />} label="Cadastros (7d / 30d)" value={`${stats.signups7d} / ${stats.signups30d}`} />
          <MetricCard icon={<CreditCard className="h-4 w-4" />} label="Pagamentos (7d / 30d)" value={`${stats.payments7d} / ${stats.payments30d}`} />
          <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Conversão 30d" value={`${funnelRate}%`} />
          <MetricCard icon={<BarChart3 className="h-4 w-4" />} label="Leads Totais" value={stats.totalLeads.toString()} />
        </div>
      </div>

      {/* Profiles & operations */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perfis & Operação</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Users className="h-4 w-4" />} label="Perfis Ativos" value={stats.activeProfiles.toString()} />
          <MetricCard icon={<Shield className="h-4 w-4" />} label="Perfis Pendentes" value={stats.pendingProfiles.toString()} highlight={stats.pendingProfiles > 0} />
          <MetricCard icon={<Mail className="h-4 w-4" />} label="Mensagens Não Lidas" value={stats.unreadMessages.toString()} highlight={stats.unreadMessages > 0} />
          <MetricCard icon={<Users className="h-4 w-4" />} label="Utilizadores Totais" value={stats.totalUsers.toString()} />
        </div>
      </div>

      {/* Commissions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comissões de Afiliados</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <CommissionCard icon={<Clock className="h-4 w-4" />} label="Pendentes" value={fmt(stats.pendingCommissions)} variant="pending" />
          <CommissionCard icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovadas" value={fmt(stats.approvedCommissions)} variant="approved" />
          <CommissionCard icon={<Banknote className="h-4 w-4" />} label="Pagas" value={fmt(stats.paidCommissions)} variant="paid" />
        </div>
      </div>

      {/* Quick access */}
      <div className="flex flex-col gap-3">
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
        {stats.unreadMessages > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
            <p className="text-sm text-foreground font-medium">
              {stats.unreadMessages} mensagem(ns) de contacto não lida(s)
            </p>
            <Link to="/admin/mensagens" className="text-sm font-medium text-primary hover:underline">
              Ver mensagens →
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top affiliates */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Top Afiliados</h2>
          {stats.topAffiliates.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum afiliado com atividade registrada.
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

function CommissionCard({ icon, label, value, variant }: { icon: React.ReactNode; label: string; value: string; variant: "pending" | "approved" | "paid" }) {
  const borderStyles = {
    pending: "border-yellow-500/20",
    approved: "border-primary/20",
    paid: "border-green-500/20",
  };
  const valueStyles = {
    pending: "text-foreground",
    approved: "text-primary",
    paid: "text-green-500",
  };
  return (
    <div className={`rounded-lg border bg-card p-5 ${borderStyles[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${valueStyles[variant]}`}>
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
