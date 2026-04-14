import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Zap, CreditCard } from "lucide-react";

interface SubRow {
  id: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  starts_at: string | null;
  created_at: string;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
  plan_price?: number;
  plan_tier?: string;
  plan_is_boost?: boolean;
}

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativa", variant: "default" },
  pending: { label: "Pendente", variant: "outline" },
  past_due: { label: "Atrasada", variant: "destructive" },
  canceled: { label: "Cancelada", variant: "secondary" },
  expired: { label: "Expirada", variant: "secondary" },
};

const TIER_STYLES: Record<string, { label: string; className: string }> = {
  exclusive: { label: "Exclusive", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  premium: { label: "Premium", className: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
  standard: { label: "Standard", className: "bg-muted text-muted-foreground border-border" },
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
        .select("*, users!subscriptions_user_id_fkey(full_name, email), plans!subscriptions_plan_id_fkey(name, price, tier, is_boost)")
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
          plan_tier: s.plans?.tier || "standard",
          plan_is_boost: s.plans?.is_boost || false,
        }))
      );
      setLoading(false);
    };
    load();
  }, [filter]);

  const subscriptionRows = subs.filter((s) => !s.plan_is_boost);
  const boostRows = subs.filter((s) => s.plan_is_boost);

  const filters = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "pending", label: "Pendentes" },
    { value: "past_due", label: "Atrasadas" },
    { value: "canceled", label: "Canceladas" },
    { value: "expired", label: "Expiradas" },
  ];

  const renderTierBadge = (tier: string) => {
    const style = TIER_STYLES[tier] || TIER_STYLES.standard;
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Assinaturas ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-sm text-muted-foreground">{subscriptionRows.length} registro(s).</p>
          </div>
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
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tier</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Início</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : subscriptionRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
              ) : (
                subscriptionRows.map((s) => {
                  const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-foreground">{s.user_name}</p>
                        <p className="text-xs text-muted-foreground">{s.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.plan_name}</td>
                      <td className="px-4 py-3 text-center">{renderTierBadge(s.plan_tier || "standard")}</td>
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

      {/* ── Compras de Boost ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Compras de Boost</h2>
            <p className="text-sm text-muted-foreground">{boostRows.length} boost(s) registrado(s).</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Boost</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : boostRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma compra de boost registrada.</td></tr>
              ) : (
                boostRows.map((s) => {
                  const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-foreground">{s.user_name}</p>
                        <p className="text-xs text-muted-foreground">{s.user_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          {s.plan_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(s.plan_price || 0)}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
