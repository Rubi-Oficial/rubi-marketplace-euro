import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { StatCard } from "./StatCard";
import { COLORS } from "./constants";
import type { ReportStats } from "./types";

interface Props {
  stats: ReportStats;
}

export function OverviewTab({ stats }: Props) {
  const userDistribution = [
    { name: "Clientes", value: stats.clientCount },
    { name: "Profissionais", value: stats.professionalCount },
    { name: "Admins", value: stats.adminCount },
  ].filter((d) => d.value > 0);

  const profileDistribution = [
    { name: "Aprovados", value: stats.approvedProfiles, fill: "hsl(var(--primary))" },
    { name: "Pendentes", value: stats.pendingProfiles, fill: "hsl(var(--primary) / 0.4)" },
    { name: "Rejeitados", value: stats.rejectedProfiles, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-4">
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
    </div>
  );
}
