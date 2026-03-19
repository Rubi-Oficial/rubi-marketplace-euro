import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface AffiliateRow {
  id: string;
  full_name: string | null;
  email: string;
  referral_code: string | null;
  clicks: number;
  signups: number;
  conversions: number;
  commissionTotal: number;
}

interface ConversionRow {
  id: string;
  referrer_name: string;
  referred_name: string;
  conversion_type: string;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "commissions">("overview");

  const fetchData = async () => {
    setLoading(true);

    // Affiliates overview
    const { data: users } = await supabase.from("users")
      .select("id, full_name, email, referral_code")
      .not("referral_code", "is", null).limit(100);

    const rows: AffiliateRow[] = [];
    if (users) {
      for (const u of users) {
        const [clicksRes, signupsRes, convRes] = await Promise.all([
          supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", u.id),
          supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by_user_id", u.id),
          supabase.from("referral_conversions").select("commission_amount").eq("referrer_user_id", u.id),
        ]);
        const convs = convRes.data || [];
        rows.push({
          ...u,
          clicks: clicksRes.count ?? 0,
          signups: signupsRes.count ?? 0,
          conversions: convs.length,
          commissionTotal: convs.reduce((s, c) => s + Number(c.commission_amount), 0),
        });
      }
      rows.sort((a, b) => b.commissionTotal - a.commissionTotal);
    }
    setAffiliates(rows);

    // Pending conversions
    const { data: convData } = await supabase.from("referral_conversions")
      .select("*, referrer:users!referral_conversions_referrer_user_id_fkey(full_name), referred:users!referral_conversions_referred_user_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(100);

    setConversions(
      (convData || []).map((c: any) => ({
        id: c.id,
        referrer_name: c.referrer?.full_name || "—",
        referred_name: c.referred?.full_name || "—",
        conversion_type: c.conversion_type,
        commission_amount: c.commission_amount,
        commission_rate: c.commission_rate,
        status: c.status,
        created_at: c.created_at,
      }))
    );

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateConversionStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("referral_conversions").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: `commission_${status}`,
      });
    }

    toast.success(status === "approved" ? "Comissão aprovada!" : "Comissão rejeitada.");
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const statusLabel: Record<string, string> = { pending: "Pendente", approved: "Aprovada", paid: "Paga", rejected: "Rejeitada" };
  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    approved: "bg-primary/10 text-primary",
    paid: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Afiliados</h1>
        <p className="mt-1 text-muted-foreground">{affiliates.length} afiliado(s), {conversions.filter((c) => c.status === "pending").length} comissão(ões) pendente(s).</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("overview")} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tab === "overview" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Visão Geral
        </button>
        <button onClick={() => setTab("commissions")} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tab === "commissions" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Comissões ({conversions.length})
        </button>
      </div>

      {tab === "overview" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cliques</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cadastros</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Conversões</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão Total</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum afiliado.</td></tr>
              ) : (
                affiliates.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-foreground">{a.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.referral_code}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.clicks}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.signups}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.conversions}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(a.commissionTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "commissions" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Afiliado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {conversions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma comissão registrada.</td></tr>
              ) : (
                conversions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-foreground">{c.referrer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.referred_name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{c.conversion_type}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(c.commission_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] || ""}`}>
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "pending" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => updateConversionStatus(c.id, "approved")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateConversionStatus(c.id, "rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
