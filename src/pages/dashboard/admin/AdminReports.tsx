import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

interface ReportStats {
  totalUsers: number;
  clientCount: number;
  professionalCount: number;
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  rejectedProfiles: number;
  totalLeads: number;
  totalSubs: number;
  activeSubs: number;
  canceledSubs: number;
  gmv: number;
  totalConversions: number;
  totalCommissions: number;
  paidCommissions: number;
  recentUsers: { id: string; full_name: string | null; email: string; role: string; created_at: string }[];
}

export default function AdminReports() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        usersRes, clientsRes, prosRes,
        profilesRes, approvedRes, pendingRes, rejectedRes,
        leadsRes, subsRes, activeSubsRes, canceledSubsRes,
        allActiveSubsRes,
        convsRes,
        recentUsersRes,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "professional"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled"),
        supabase.from("subscriptions").select("plans(price)").eq("status", "active"),
        supabase.from("referral_conversions").select("commission_amount, status"),
        supabase.from("users").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const gmv = (allActiveSubsRes.data || []).reduce((s, sub: any) => s + Number(sub.plans?.price || 0), 0);
      const convs = convsRes.data || [];
      const totalComm = convs.reduce((s, c) => s + Number(c.commission_amount), 0);
      const paidComm = convs.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0);

      setStats({
        totalUsers: usersRes.count ?? 0,
        clientCount: clientsRes.count ?? 0,
        professionalCount: prosRes.count ?? 0,
        totalProfiles: profilesRes.count ?? 0,
        approvedProfiles: approvedRes.count ?? 0,
        pendingProfiles: pendingRes.count ?? 0,
        rejectedProfiles: rejectedRes.count ?? 0,
        totalLeads: leadsRes.count ?? 0,
        totalSubs: subsRes.count ?? 0,
        activeSubs: activeSubsRes.count ?? 0,
        canceledSubs: canceledSubsRes.count ?? 0,
        gmv,
        totalConversions: convs.length,
        totalCommissions: totalComm,
        paidCommissions: paidComm,
        recentUsers: (recentUsersRes.data || []) as any,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!stats) return null;

  const roleLabels: Record<string, string> = { client: "Cliente", professional: "Profissional", admin: "Admin" };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="mt-1 text-muted-foreground">Visão consolidada da plataforma.</p>
      </div>

      {/* Users */}
      <Section title="Usuários">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <Stat label="Total" value={stats.totalUsers.toString()} />
          <Stat label="Clientes" value={stats.clientCount.toString()} />
          <Stat label="Profissionais" value={stats.professionalCount.toString()} />
        </div>
      </Section>

      {/* Profiles */}
      <Section title="Perfis">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Stat label="Total" value={stats.totalProfiles.toString()} />
          <Stat label="Aprovados" value={stats.approvedProfiles.toString()} />
          <Stat label="Pendentes" value={stats.pendingProfiles.toString()} />
          <Stat label="Rejeitados" value={stats.rejectedProfiles.toString()} />
        </div>
      </Section>

      {/* Revenue */}
      <Section title="Financeiro">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Stat label="GMV (Ativas)" value={fmt(stats.gmv)} />
          <Stat label="Assinaturas Ativas" value={stats.activeSubs.toString()} />
          <Stat label="Canceladas" value={stats.canceledSubs.toString()} />
          <Stat label="Leads" value={stats.totalLeads.toString()} />
        </div>
      </Section>

      {/* Affiliates */}
      <Section title="Afiliados">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <Stat label="Conversões" value={stats.totalConversions.toString()} />
          <Stat label="Comissões Totais" value={fmt(stats.totalCommissions)} />
          <Stat label="Comissões Pagas" value={fmt(stats.paidCommissions)} />
        </div>
      </Section>

      {/* Recent users table */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Últimos Cadastros</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Papel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
