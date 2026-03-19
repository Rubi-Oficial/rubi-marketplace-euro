import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface SubRow {
  id: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  starts_at: string | null;
  created_at: string;
  stripe_subscription_id: string | null;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
  plan_price?: number;
}

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativa", variant: "default" },
  pending: { label: "Pendente", variant: "outline" },
  past_due: { label: "Atrasada", variant: "destructive" },
  canceled: { label: "Cancelada", variant: "secondary" },
  expired: { label: "Expirada", variant: "secondary" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

export default function AdminPayments() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("subscriptions")
        .select("*, users!subscriptions_user_id_fkey(full_name, email), plans!subscriptions_plan_id_fkey(name, price)")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter as any);

      const { data } = await query;
      setSubs(
        (data || []).map((s: any) => ({
          ...s,
          user_email: s.users?.email || "—",
          user_name: s.users?.full_name || "—",
          plan_name: s.plans?.name || "—",
          plan_price: s.plans?.price || 0,
        }))
      );
      setLoading(false);
    };
    load();
  }, [filter]);

  const filters = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "pending", label: "Pendentes" },
    { value: "past_due", label: "Atrasadas" },
    { value: "canceled", label: "Canceladas" },
    { value: "expired", label: "Expiradas" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pagamentos e Assinaturas</h1>
        <p className="mt-1 text-muted-foreground">{subs.length} registro(s).</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Início</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
              ))
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
            ) : (
              subs.map((s) => {
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-foreground">{s.user_name}</p>
                      <p className="text-xs text-muted-foreground">{s.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{s.plan_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(s.plan_price || 0)}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={st.variant}>{st.label}</Badge></td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {s.starts_at ? new Date(s.starts_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
