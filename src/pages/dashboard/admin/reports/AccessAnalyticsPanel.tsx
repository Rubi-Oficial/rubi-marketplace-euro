import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  ShieldAlert, Monitor, Smartphone, Tablet,
  Eye, Bot, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, UserCheck,
  TrendingDown, Layers,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { DEVICE_COLORS } from "./constants";
import { classifyBot, BOT_SEVERITY_STYLES } from "./botClassification";
import { getCountryFlag, getCountryLabel } from "./countryFlags";
import type { AccessAnalytics } from "./types";

interface Props {
  data: AccessAnalytics;
  onRefresh: () => void;
  refreshing: boolean;
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (type === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

export function AccessAnalyticsPanel({ data, onRefresh, refreshing }: Props) {
  const botRate24h = data.visits_24h > 0 ? ((data.bot_count_24h / data.visits_24h) * 100).toFixed(1) : "0";
  const hasSuspicious = data.suspicious_ips.length > 0 || data.suspicious_sessions.length > 0;
  const [expandedBotRow, setExpandedBotRow] = useState<number | null>(null);
  const [showAllBots, setShowAllBots] = useState(false);

  const dailyChartData = data.daily_visits.map((d) => ({
    day: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Visitas: d.visits,
    Únicos: d.unique_sessions,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
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
              <BarChart data={(data.hourly_distribution ?? []).map((h) => ({
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

      {/* Top pages + devices */}
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

      {/* Traffic sources + geo */}
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

      {/* Top authenticated users + UTM campaigns */}
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
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.recent_bots.length > 15 && (
              <div className="px-3 py-2 border-t border-border">
                <button
                  onClick={() => setShowAllBots((v) => !v)}
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
