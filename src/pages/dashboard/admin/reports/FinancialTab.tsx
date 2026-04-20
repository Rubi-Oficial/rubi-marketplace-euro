import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { StatCard } from "@/components/shared/StatCard";
import { fmtCurrency } from "./constants";
import type { ReportStats } from "./types";

interface Props {
  stats: ReportStats;
}

export function FinancialTab({ stats }: Props) {
  const financialData = [
    { name: "GMV", value: stats.gmv },
    { name: "Comissões Total", value: stats.totalCommissions },
    { name: "Pendentes", value: stats.pendingCommissions },
    { name: "Aprovadas", value: stats.approvedCommissions },
    { name: "Pagas", value: stats.paidCommissions },
  ];

  return (
    <div className="space-y-4">
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
    </div>
  );
}
