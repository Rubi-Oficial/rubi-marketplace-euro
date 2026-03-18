import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AffiliateRow {
  id: string;
  full_name: string | null;
  referral_code: string | null;
  conversions: number;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("users")
      .select("id, full_name, referral_code")
      .not("referral_code", "is", null)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }

        const rows: AffiliateRow[] = [];
        for (const u of data) {
          const { count } = await supabase
            .from("referral_conversions")
            .select("id", { count: "exact", head: true })
            .eq("referrer_user_id", u.id);
          rows.push({
            id: u.id,
            full_name: u.full_name,
            referral_code: u.referral_code,
            conversions: count ?? 0,
          });
        }
        setAffiliates(rows);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Afiliados</h1>
      <p className="mt-1 text-muted-foreground">Programa de indicações.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conversões</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : affiliates.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum afiliado registado.
                </td>
              </tr>
            ) : (
              affiliates.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{a.full_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.referral_code}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{a.conversions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
