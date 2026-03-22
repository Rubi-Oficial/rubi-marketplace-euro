import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Users, FileText, DollarSign, Link2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))", "hsl(var(--primary) / 0.4)"];

interface ReportStats {
  totalUsers: number;
  clientCount: number;
  professionalCount: number;
  adminCount: number;
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
        usersRes, clientsRes, prosRes, adminsRes,
        profilesRes, approvedRes, pendingRes, rejectedRes,
        leadsRes, subsRes, activeSubsRes, canceledSubsRes,
        allActiveSubsRes,
        convsRes,
        recentUsersRes,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "professional"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
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
        adminCount: adminsRes.count ?? 0,
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const roleLabels: Record<string, string> = { client: "Cliente", professional: "Profissional", admin: "Admin" };

  // Chart data
  const userDistribution = [
    { name: "Clientes", value: stats.clientCount },
    { name: "Profissionais", value: stats.professionalCount },
    { name: "Admins", value: stats.adminCount },
  ].filter(d => d.value > 0);

  const profileDistribution = [
    { name: "Aprovados", value: stats.approvedProfiles, fill: "hsl(var(--primary))" },
    { name: "Pendentes", value: stats.pendingProfiles, fill: "hsl(var(--primary) / 0.4)" },
    { name: "Rejeitados", value: stats.rejectedProfiles, fill: "hsl(var(--destructive))" },
  ];

  const financialData = [
    { name: "GMV", value: stats.gmv },
    { name: "Comissões", value: stats.totalCommissions },
    { name: "Pagas", value: stats.paidCommissions },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Visão consolidada da plataforma.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Financeiro</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Cadastros</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Usuários" value={stats.totalUsers.toString()} />
            <StatCard label="Total Perfis" value={stats.totalProfiles.toString()} />
            <StatCard label="Total Leads" value={stats.totalLeads.toString()} />
            <StatCard label="Total Assinaturas" value={stats.totalSubs.toString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={userDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {userDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm">
                    {userDistribution.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-medium tabular-nums text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status dos Perfis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={profileDistribution} layout="vertical" barSize={20}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {profileDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Financial Tab ── */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label="GMV (Ativas)" value={fmt(stats.gmv)} />
            <StatCard label="Assinaturas Ativas" value={stats.activeSubs.toString()} />
            <StatCard label="Canceladas" value={stats.canceledSubs.toString()} />
            <StatCard label="Conversões" value={stats.totalConversions.toString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita vs Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={financialData} barSize={40}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => fmt(value)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comissões de Afiliados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold tabular-nums text-foreground">{fmt(stats.totalCommissions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagas</p>
                    <p className="text-xl font-bold tabular-nums text-green-600">{fmt(stats.paidCommissions)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso de pagamento</span>
                    <span className="tabular-nums">{stats.totalCommissions > 0 ? ((stats.paidCommissions / stats.totalCommissions) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${stats.totalCommissions > 0 ? (stats.paidCommissions / stats.totalCommissions) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimos Cadastros</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Papel</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{u.full_name || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="outline" className="text-xs">{roleLabels[u.role] || u.role}</Badge>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
