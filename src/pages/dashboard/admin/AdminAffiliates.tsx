import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Affiliate {
  id: string;
  full_name: string | null;
  affiliate_code: string | null;
  referral_count: number;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, affiliate_code")
      .not("affiliate_code", "is", null)
      .then(async ({ data }) => {
        if (!data) {
          setLoading(false);
          return;
        }
        // Count referrals for each affiliate
        const withCounts = await Promise.all(
          data.map(async (affiliate) => {
            const { count } = await supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("referred_by", affiliate.id);
            return { ...affiliate, referral_count: count ?? 0 };
          })
        );
        setAffiliates(withCounts);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Afiliados</h1>
      <p className="mt-1 text-muted-foreground">Programa de afiliados da plataforma.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicações</th>
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
                  Nenhum afiliado registrado.
                </td>
              </tr>
            ) : (
              affiliates.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{a.full_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{a.affiliate_code}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{a.referral_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
