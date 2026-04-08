import { useEffect, useState, useMemo, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  Users, FileText, DollarSign, Globe, ShieldAlert, Monitor, Smartphone, Tablet,
  Eye, Bot, AlertTriangle, Info, ChevronDown, ChevronUp, RefreshCw, UserCheck,
  TrendingDown, Layers, CalendarIcon, Filter,
} from "lucide-react";

const fmtCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))", "hsl(var(--primary) / 0.4)"];
const DEVICE_COLORS: Record<string, string> = {
  desktop: "hsl(var(--primary))",
  mobile: "hsl(var(--primary) / 0.6)",
  tablet: "hsl(var(--primary) / 0.3)",
  unknown: "hsl(var(--muted-foreground))",
};

type DatePreset = "7d" | "30d" | "90d" | "all" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ── Date Filter Component ──
function DateRangeFilter({
  preset,
  range,
  onPresetChange,
  onRangeChange,
}: {
  preset: DatePreset;
  range: DateRange;
  onPresetChange: (p: DatePreset) => void;
  onRangeChange: (r: DateRange) => void;
}) {
  const presets: { value: DatePreset; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "all", label: "Tudo" },
    { value: "custom", label: "Personalizado" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">Período:</span>
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => onPresetChange(p.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            preset === p.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <CalendarIcon className="h-3 w-3" />
                {range.from ? format(range.from, "dd/MM/yyyy") : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={range.from}
                onSelect={(d) => onRangeChange({ ...range, from: d })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <CalendarIcon className="h-3 w-3" />
                {range.to ? format(range.to, "dd/MM/yyyy") : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={range.to}
                onSelect={(d) => onRangeChange({ ...range, to: d })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      {preset !== "all" && range.from && (
        <span className="text-[10px] text-muted-foreground ml-1">
          {format(range.from, "dd/MM/yyyy")} — {range.to ? format(range.to, "dd/MM/yyyy") : "hoje"}
        </span>
      )}
    </div>
  );
}

// ── Helpers ──
function getDateRange(preset: DatePreset, custom: DateRange): { from: string | null; to: string | null } {
  const now = new Date();
  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
    case "30d":
      return { from: startOfDay(subDays(now, 30)).toISOString(), to: endOfDay(now).toISOString() };
    case "90d":
      return { from: startOfDay(subDays(now, 90)).toISOString(), to: endOfDay(now).toISOString() };
    case "custom":
      return {
        from: custom.from ? startOfDay(custom.from).toISOString() : null,
        to: custom.to ? endOfDay(custom.to).toISOString() : endOfDay(now).toISOString(),
      };
    default:
      return { from: null, to: null };
  }
}

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
  pendingCommissions: number;
  approvedCommissions: number;
  recentUsers: { id: string; full_name: string | null; email: string; role: string; created_at: string }[];
}

interface AccessAnalytics {
  visits_24h: number;
  visits_7d: number;
  visits_30d: number;
  unique_sessions_24h: number;
  unique_sessions_7d: number;
  unique_sessions_30d: number;
  bot_count_24h: number;
  bot_count_7d: number;
  daily_visits: { day: string; visits: number; unique_sessions: number }[];
  top_pages: { page_path: string; hits: number }[];
  device_distribution: { device: string; visits: number }[];
  top_referrers: { referrer: string; visits: number }[];
  top_utm_sources: { utm_source: string; visits: number }[];
  top_countries: { country: string; visits: number }[];
  top_cities: { city: string; visits: number }[];
  suspicious_ips: { ip_hash: string; hits: number; last_seen: string; unique_pages: number; is_known_bot: boolean; country_code: string; city_name: string; user_agent_sample: string | null }[];
  suspicious_sessions: { session_id: string; pageviews: number; started: string; last_seen: string; unique_pages: number }[];
  recent_bots: { ip_hash: string; user_agent: string; page_path: string; created_at: string; country_code: string; city_name: string }[];
  bot_by_agent: { user_agent: string; hits: number; unique_ips: number; unique_pages: number; first_seen: string; last_seen: string; pages_visited: string[] }[];
  authenticated_visits_24h: number;
  authenticated_visits_7d: number;
  anonymous_visits_24h: number;
  bounce_rate_7d: number | null;
  avg_session_depth_7d: number | null;
  hourly_distribution: { hour: number; visits: number; bot_visits: number; auth_visits: number }[];
  top_authenticated_users: { user_id: string; display_name: string; role: string; visits: number; sessions: number; unique_pages: number; last_seen: string }[];
  top_utm_campaigns: { utm_campaign: string; utm_source: string; utm_medium: string; visits: number; unique_sessions: number }[];
}

export default function AdminReports() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [accessData, setAccessData] = useState<AccessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  // Date filter state
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });

  const dateRange = useMemo(() => getDateRange(preset, customRange), [preset, customRange]);

  const handlePresetChange = useCallback((p: DatePreset) => {
    setPreset(p);
    if (p !== "custom") {
      setCustomRange({ from: undefined, to: undefined });
    }
  }, []);

  // Load stats when date range changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { from, to } = dateRange;

        // Helper to apply date filter
        const withDate = (q: any) => {
          let query = q;
          if (from) query = query.gte("created_at", from);
          if (to) query = query.lte("created_at", to);
          return query;
        };

        const [
          usersRes, clientsRes, prosRes, adminsRes,
          profilesRes, approvedRes, pendingRes, rejectedRes,
          leadsRes, subsRes, activeSubsRes, canceledSubsRes,
          allActiveSubsRes, convsRes, recentUsersRes,
        ] = await Promise.all([
          withDate(supabase.from("users").select("id", { count: "exact", head: true })),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client")),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "professional")),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin")),
          withDate(supabase.from("profiles").select("id", { count: "exact", head: true })),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
          withDate(supabase.from("leads").select("id", { count: "exact", head: true })),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true })),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled")),
          supabase.from("subscriptions").select("plans(price)").eq("status", "active"),
          withDate(supabase.from("referral_conversions").select("commission_amount, status")),
          supabase.from("users").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(10),
        ]);

        const gmv = (allActiveSubsRes.data || []).reduce((s, sub: any) => s + Number(sub.plans?.price || 0), 0);
        const convs = convsRes.data || [];
        const totalComm = convs.reduce((s, c) => s + Number(c.commission_amount), 0);
        const paidComm = convs.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0);
        const pendingComm = convs.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);
        const approvedComm = convs.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.commission_amount), 0);

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
          pendingCommissions: pendingComm,
          approvedCommissions: approvedComm,
          recentUsers: (recentUsersRes.data || []) as any,
        });
      } catch (err) {
        console.error("[AdminReports] Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange]);

  const loadAccessAnalytics = async (force = false) => {
    if (accessData && !force) return;
    setAccessLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_access_analytics");
      if (!error && data) {
        setAccessData(data as unknown as AccessAnalytics);
      }
    } catch {
      // silently fail
    }
    setAccessLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const roleLabels: Record<string, string> = { client: "Cliente", professional: "Profissional", admin: "Admin" };

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
    { name: "Comissões Total", value: stats.totalCommissions },
    { name: "Pendentes", value: stats.pendingCommissions },
    { name: "Aprovadas", value: stats.approvedCommissions },
    { name: "Pagas", value: stats.paidCommissions },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Visão consolidada da plataforma.</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-3">
          <DateRangeFilter
            preset={preset}
            range={customRange}
            onPresetChange={handlePresetChange}
            onRangeChange={setCustomRange}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={(v) => { if (v === "access") loadAccessAnalytics(); }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Financeiro</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Cadastros</TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Acessos</TabsTrigger>
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
            <StatCard label="GMV (Ativas)" value={fmtCurrency(stats.gmv)} />
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
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={financialData} barSize={36}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => fmtCurrency(value)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                      {financialData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : i >= 3 ? "hsl(142 71% 45%)" : "hsl(var(--primary) / 0.5)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comissões de Afiliados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">{fmtCurrency(stats.pendingCommissions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aprovadas</p>
                    <p className="text-lg font-bold tabular-nums text-primary">{fmtCurrency(stats.approvedCommissions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagas</p>
                    <p className="text-lg font-bold tabular-nums text-green-600">{fmtCurrency(stats.paidCommissions)}</p>
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

        {/* ── Access Analytics Tab ── */}
        <TabsContent value="access" className="space-y-4">
          {accessLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : accessData ? (
            <AccessAnalyticsPanel data={accessData} onRefresh={() => loadAccessAnalytics(true)} refreshing={accessLoading} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum dado de acesso disponível ainda.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bot classification helpers
// ---------------------------------------------------------------------------

type BotSeverity = "safe" | "seo" | "warning" | "danger";

interface BotClassification {
  name: string;
  type: string;
  intent: string;
  severity: BotSeverity;
  recommendation: string;
}

function classifyBot(userAgent: string): BotClassification {
  const ua = (userAgent || "").toLowerCase();

  if (ua.includes("googlebot"))
    return { name: "Googlebot", type: "Rastreador de busca", intent: "Indexação SEO (Google)", severity: "safe", recommendation: "Nenhuma ação necessária. Garanta um sitemap.xml atualizado para melhor indexação." };
  if (ua.includes("bingbot") || ua.includes("bingpreview"))
    return { name: "Bingbot", type: "Rastreador de busca", intent: "Indexação SEO (Bing)", severity: "safe", recommendation: "Nenhuma ação necessária. Considere cadastrar o site no Bing Webmaster Tools." };
  if (ua.includes("yandexbot") || ua.includes("yandex"))
    return { name: "YandexBot", type: "Rastreador de busca", intent: "Indexação SEO (Yandex)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("duckduckbot"))
    return { name: "DuckDuckBot", type: "Rastreador de busca", intent: "Indexação SEO (DuckDuckGo)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("baiduspider"))
    return { name: "Baiduspider", type: "Rastreador de busca", intent: "Indexação SEO (Baidu, China)", severity: "safe", recommendation: "Nenhuma ação necessária, tráfego esperado de mercado chinês." };
  if (ua.includes("slurp"))
    return { name: "Yahoo Slurp", type: "Rastreador de busca", intent: "Indexação SEO (Yahoo)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("applebot"))
    return { name: "Applebot", type: "Rastreador de busca", intent: "Indexação para Spotlight/Siri", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("facebookexternalhit") || ua.includes("facebot"))
    return { name: "Facebook Bot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar links no Facebook/Instagram", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("twitterbot"))
    return { name: "TwitterBot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar no X/Twitter", severity: "safe", recommendation: "Adicione meta tags Twitter Card ao site." };
  if (ua.includes("linkedinbot"))
    return { name: "LinkedInBot", type: "Pré-visualização social", intent: "Geração de preview no LinkedIn", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("whatsapp"))
    return { name: "WhatsApp Bot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar links no WhatsApp", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("telegrambot"))
    return { name: "TelegramBot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar no Telegram", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("uptimerobot"))
    return { name: "UptimeRobot", type: "Monitoramento", intent: "Verificação de disponibilidade do site", severity: "safe", recommendation: "Esperado se você usa UptimeRobot." };
  if (ua.includes("pingdom"))
    return { name: "Pingdom", type: "Monitoramento", intent: "Monitoramento de disponibilidade e performance", severity: "safe", recommendation: "Esperado se você usa Pingdom." };
  if (ua.includes("gtmetrix"))
    return { name: "GTmetrix", type: "Análise de performance", intent: "Análise de velocidade do site", severity: "safe", recommendation: "Esperado se você usa GTmetrix para análises." };
  if (ua.includes("pagespeed") || ua.includes("lighthouse"))
    return { name: "PageSpeed/Lighthouse", type: "Análise de performance", intent: "Auditoria de velocidade (Google)", severity: "safe", recommendation: "Esperado, tráfego legítimo." };
  if (ua.includes("ahrefsbot"))
    return { name: "AhrefsBot", type: "Ferramenta SEO", intent: "Análise de backlinks e conteúdo (Ahrefs)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt se não desejar que a Ahrefs rastreie o site." };
  if (ua.includes("semrushbot"))
    return { name: "SemrushBot", type: "Ferramenta SEO", intent: "Análise de palavras-chave e competidores (SEMrush)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt: 'User-agent: SemrushBot\\nDisallow: /'" };
  if (ua.includes("mj12bot"))
    return { name: "MJ12Bot", type: "Ferramenta SEO", intent: "Análise de links (Majestic SEO)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt se não quiser rastreamento da Majestic." };
  if (ua.includes("dotbot"))
    return { name: "DotBot", type: "Ferramenta SEO", intent: "Análise de links (Moz)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt." };
  if (ua.includes("rogerbot"))
    return { name: "Rogerbot", type: "Ferramenta SEO", intent: "Rastreador da Moz", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt." };
  if (ua.includes("petalbot"))
    return { name: "PetalBot", type: "Rastreador de busca", intent: "Indexação para Huawei/Petal Search", severity: "seo", recommendation: "Nenhuma ação necessária, tráfego esperado." };
  if (ua.includes("go-http-client"))
    return { name: "Go HTTP Client", type: "Script automatizado (Go)", intent: "Scraping ou automação via linguagem Go", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, considere adicionar rate-limiting ou bloquear o IP no firewall/CDN." };
  if (ua.includes("python-requests") || ua.includes("python-urllib"))
    return { name: "Python Script", type: "Script automatizado (Python)", intent: "Scraping ou automação via Python", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, implemente CAPTCHA ou rate-limiting." };
  if (ua.includes("java/") || ua.includes("apache-httpclient") || ua.includes("okhttp"))
    return { name: "Java HTTP Client", type: "Script automatizado (Java)", intent: "Scraping ou automação via Java", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, aplique rate-limiting." };
  if (ua.startsWith("curl"))
    return { name: "cURL", type: "Ferramenta CLI", intent: "Teste manual ou script de automação", severity: "warning", recommendation: "Geralmente inofensivo se volume baixo. Se repetitivo de um mesmo IP, monitore." };
  if (ua.startsWith("wget"))
    return { name: "wget", type: "Ferramenta CLI", intent: "Download ou scraping via wget", severity: "warning", recommendation: "Se repetitivo de um mesmo IP, considere bloquear no firewall." };
  if (ua.includes("scrapy"))
    return { name: "Scrapy", type: "Framework de scraping", intent: "Extração massiva de dados via Scrapy", severity: "danger", recommendation: "Alto risco de extração de dados. Implemente CAPTCHA, rate-limiting e analise o IP para possível bloqueio." };
  if (ua.includes("puppeteer") || ua.includes("playwright") || ua.includes("headlesschrome") || ua.includes("headless"))
    return { name: "Navegador headless", type: "Automação de browser", intent: "Scraping ou automação com browser headless", severity: "danger", recommendation: "Possível tentativa de bypass de proteções. Considere implementar CAPTCHA ou Cloudflare Bot Management." };
  if (ua.includes("selenium"))
    return { name: "Selenium", type: "Automação de browser", intent: "Testes automatizados ou scraping via Selenium", severity: "warning", recommendation: "Pode ser scraping ou testes. Monitore o IP de origem." };
  if (!ua || ua.trim() === "")
    return { name: "Sem User Agent", type: "Acesso suspeito", intent: "Acesso sem identificação (possível scanner ou bot primitivo)", severity: "danger", recommendation: "Bloquear requisições sem User-Agent no servidor ou CDN é uma boa prática de segurança." };

  return { name: "Bot desconhecido", type: "Desconhecido", intent: "Origem não identificada", severity: "warning", recommendation: "Monitore a frequência de acessos deste agente e o IP de origem." };
}

const BOT_SEVERITY_STYLES: Record<BotSeverity, { badge: string; row: string; icon: React.ReactNode }> = {
  safe: { badge: "bg-green-100 text-green-800 border-green-200", row: "", icon: <Info className="h-3 w-3 text-green-600" /> },
  seo: { badge: "bg-blue-100 text-blue-800 border-blue-200", row: "", icon: <Globe className="h-3 w-3 text-blue-600" /> },
  warning: { badge: "bg-yellow-100 text-yellow-800 border-yellow-200", row: "bg-yellow-50/30", icon: <AlertTriangle className="h-3 w-3 text-yellow-600" /> },
  danger: { badge: "bg-red-100 text-red-800 border-red-200", row: "bg-red-50/30", icon: <ShieldAlert className="h-3 w-3 text-red-600" /> },
};

function AccessAnalyticsPanel({ data, onRefresh, refreshing }: { data: AccessAnalytics; onRefresh: () => void; refreshing: boolean }) {
  const botRate24h = data.visits_24h > 0 ? ((data.bot_count_24h / data.visits_24h) * 100).toFixed(1) : "0";
  const hasSuspicious = data.suspicious_ips.length > 0 || data.suspicious_sessions.length > 0;
  const [expandedBotRow, setExpandedBotRow] = useState<number | null>(null);
  const [showAllBots, setShowAllBots] = useState(false);

  const dailyChartData = data.daily_visits.map(d => ({
    day: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Visitas: d.visits,
    Únicos: d.unique_sessions,
  }));

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
    if (type === "tablet") return <Tablet className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Análise de Acessos</h2>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs row 1 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visitas (24h)" value={data.visits_24h.toLocaleString()} />
        <StatCard label="Visitas (7d)" value={data.visits_7d.toLocaleString()} />
        <StatCard label="Únicos (7d)" value={data.unique_sessions_7d.toLocaleString()} />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bots (24h)</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">{data.bot_count_24h}</p>
              <Badge variant={Number(botRate24h) > 20 ? "destructive" : "outline"} className="text-xs">{botRate24h}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs row 2 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><UserCheck className="h-3 w-3" /> Autenticados (24h)</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">{(data.authenticated_visits_24h ?? 0).toLocaleString()}</p>
              {data.visits_24h > 0 && (
                <span className="text-xs text-muted-foreground">({((data.authenticated_visits_24h ?? 0) / data.visits_24h * 100).toFixed(0)}%)</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> Anônimos (24h)</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{(data.anonymous_visits_24h ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Taxa de Rejeição (7d)</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                {data.bounce_rate_7d != null ? `${data.bounce_rate_7d}%` : "—"}
              </p>
              {data.bounce_rate_7d != null && (
                <Badge variant={data.bounce_rate_7d > 70 ? "destructive" : data.bounce_rate_7d > 50 ? "outline" : "secondary"} className="text-xs">
                  {data.bounce_rate_7d > 70 ? "Alto" : data.bounce_rate_7d > 50 ? "Médio" : "Bom"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Profundidade Média (7d)</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
              {data.avg_session_depth_7d != null ? `${data.avg_session_depth_7d} pág.` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security alert */}
      {hasSuspicious && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <ShieldAlert className="h-4 w-4" /> Alertas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.suspicious_ips.length > 0 && (
              <div>
                <p className="font-medium text-foreground mb-1">IPs com volume anormal (&gt;100 hits/hora)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1.5 text-left text-muted-foreground">IP Hash</th>
                        <th className="px-2 py-1.5 text-left text-muted-foreground">País / Cidade</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Hits</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Páginas</th>
                        <th className="px-2 py-1.5 text-center text-muted-foreground">Bot?</th>
                        <th className="px-2 py-1.5 text-left text-muted-foreground">User Agent</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Último</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.suspicious_ips.map((ip, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-1.5 font-mono text-foreground">{ip.ip_hash.substring(0, 12)}…</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{ip.country_code || "—"}{ip.city_name ? ` / ${ip.city_name}` : ""}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-destructive font-medium">{ip.hits}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{ip.unique_pages}</td>
                          <td className="px-2 py-1.5 text-center">{ip.is_known_bot ? "✓" : "—"}</td>
                          <td className="px-2 py-1.5 max-w-[180px] truncate text-muted-foreground" title={ip.user_agent_sample || undefined}>{ip.user_agent_sample ? ip.user_agent_sample.substring(0, 40) + (ip.user_agent_sample.length > 40 ? "…" : "") : "—"}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{new Date(ip.last_seen).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.suspicious_sessions.length > 0 && (
              <div>
                <p className="font-medium text-foreground mb-1">Sessões com &gt;50 pageviews</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1.5 text-left text-muted-foreground">Session</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Views</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Páginas</th>
                        <th className="px-2 py-1.5 text-right text-muted-foreground">Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.suspicious_sessions.map((s, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-1.5 font-mono text-foreground">{s.session_id.substring(0, 8)}…</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-destructive font-medium">{s.pageviews}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{s.unique_pages}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {Math.round((new Date(s.last_seen).getTime() - new Date(s.started).getTime()) / 60000)}min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily visits chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Visitas por Dia (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Visitas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Únicos" stroke="hsl(var(--primary) / 0.4)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Hourly distribution chart */}
      {(data.hourly_distribution ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição Horária (últimas 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(data.hourly_distribution ?? []).map(h => ({
                hora: `${String(h.hour).padStart(2, "0")}h`,
                Visitas: h.visits,
                Bots: h.bot_visits,
                Autenticados: h.auth_visits,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Visitas" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Bots" fill="hsl(var(--destructive) / 0.6)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Autenticados" fill="hsl(var(--primary) / 0.4)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top 10 Páginas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_pages.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.top_pages} layout="vertical" barSize={16}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="page_path" axisLine={false} tickLine={false} width={120}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: string) => v.length > 20 ? v.substring(0, 20) + "…" : v}
                  />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="hits" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Device distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.device_distribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={data.device_distribution} dataKey="visits" nameKey="device" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                      {data.device_distribution.map((d) => (
                        <Cell key={d.device} fill={DEVICE_COLORS[d.device] || DEVICE_COLORS.unknown} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 text-sm">
                  {data.device_distribution.map((d) => (
                    <div key={d.device} className="flex items-center gap-2">
                      <DeviceIcon type={d.device} />
                      <span className="text-muted-foreground capitalize">{d.device}</span>
                      <span className="ml-auto font-medium tabular-nums text-foreground">{d.visits}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Origens do Tráfego</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_referrers.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground truncate max-w-[200px]">{r.referrer}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{r.visits}</td>
                    </tr>
                  ))}
                  {data.top_referrers.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-4 text-center text-muted-foreground">Sem dados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geolocalização</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">País</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cidade</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_countries.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">{c.country}</td>
                      <td className="px-4 py-2 text-muted-foreground">{data.top_cities[i]?.city || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{c.visits}</td>
                    </tr>
                  ))}
                  {data.top_countries.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Sem dados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Authenticated Users + UTM Campaigns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserCheck className="h-4 w-4" /> Usuários Mais Ativos (7d)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data.top_authenticated_users ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-y border-border bg-muted/30">
                      <th className="px-3 py-2 text-left text-muted-foreground">Usuário</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Papel</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Visitas</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Sessões</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Páginas</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.top_authenticated_users ?? []).map((u, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                        <td className="px-3 py-1.5 font-medium text-foreground max-w-[160px] truncate">{u.display_name}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant="outline" className="text-[10px]">{u.role === "client" ? "Cliente" : u.role === "professional" ? "Profissional" : u.role === "admin" ? "Admin" : u.role}</Badge>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{u.visits}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{u.sessions}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{u.unique_pages}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{new Date(u.last_seen).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário autenticado registrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas UTM (30d)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data.top_utm_campaigns ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-y border-border bg-muted/30">
                      <th className="px-3 py-2 text-left text-muted-foreground">Campanha</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Fonte / Meio</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Visitas</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Sessões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.top_utm_campaigns ?? []).map((c, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-1.5 font-medium text-foreground max-w-[140px] truncate">{c.utm_campaign}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.utm_source} / {c.utm_medium}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{c.visits}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{c.unique_sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem dados de campanhas UTM</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bots */}
      {data.recent_bots.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bot className="h-4 w-4" /> Bots Recentes (24h) — {data.recent_bots.length} registros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-muted-foreground">Bot / Tipo</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Intenção</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">IP Hash</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">País</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Página</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">Hora</th>
                    <th className="px-3 py-2 text-right text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllBots ? data.recent_bots : data.recent_bots.slice(0, 15)).map((b, i) => {
                    const cls = classifyBot(b.user_agent);
                    const style = BOT_SEVERITY_STYLES[cls.severity];
                    const isExpanded = expandedBotRow === i;
                    return (
                      <React.Fragment key={i}>
                        <tr
                          className={`border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/20 ${style.row}`}
                          onClick={() => setExpandedBotRow(isExpanded ? null : i)}
                        >
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              {style.icon}
                              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}>{cls.name}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{cls.type}</div>
                          </td>
                          <td className="px-3 py-1.5 max-w-[160px]">
                            <span className="text-foreground/80">{cls.intent}</span>
                          </td>
                          <td className="px-3 py-1.5 font-mono text-foreground">{b.ip_hash?.substring(0, 12) || "—"}…</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{b.country_code || "—"}{b.city_name ? ` / ${b.city_name}` : ""}</td>
                          <td className="px-3 py-1.5 text-foreground">{b.page_path}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{new Date(b.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-3 py-1.5 text-right">
                            {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground inline" /> : <ChevronDown className="h-3 w-3 text-muted-foreground inline" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`exp-${i}`} className="border-b border-border/50 bg-muted/10">
                            <td colSpan={7} className="px-4 py-3 space-y-2">
                              <div>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">User Agent completo</span>
                                <p className="mt-0.5 break-all font-mono text-[11px] text-foreground/80">{b.user_agent || "—"}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sugestão / Ação recomendada</span>
                                  <p className="mt-0.5 text-[11px] text-foreground/80">{cls.recommendation}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.recent_bots.length > 15 && (
              <div className="px-3 py-2 border-t border-border">
                <button
                  onClick={() => setShowAllBots(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showAllBots ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showAllBots ? "Ver menos" : `Ver todos (${data.recent_bots.length})`}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bot summary by agent */}
      {(data.bot_by_agent ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bot className="h-4 w-4" /> Resumo de Bots por Agente (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-muted-foreground">Bot / Tipo</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Intenção</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">Hits</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">IPs únicos</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">Páginas</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Páginas visitadas</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Ação recomendada</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.bot_by_agent ?? []).map((b, i) => {
                    const cls = classifyBot(b.user_agent);
                    const style = BOT_SEVERITY_STYLES[cls.severity];
                    return (
                      <tr key={i} className={`border-b border-border/50 last:border-0 ${style.row}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {style.icon}
                            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}>{cls.name}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] break-all">{b.user_agent}</div>
                        </td>
                        <td className="px-3 py-2 text-foreground/80">{cls.intent}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{b.hits}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.unique_ips}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.unique_pages}</td>
                        <td className="px-3 py-2 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {(b.pages_visited ?? []).slice(0, 4).map((p, j) => (
                              <span key={j} className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{p}</span>
                            ))}
                            {(b.pages_visited ?? []).length > 4 && (
                              <span className="text-[10px] text-muted-foreground">+{(b.pages_visited ?? []).length - 4} mais</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-foreground/70 max-w-[240px]">{cls.recommendation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
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