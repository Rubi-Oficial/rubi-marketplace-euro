import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SubRow {
  id: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export default function AdminPayments() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("id, user_id, status, expires_at, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSubs((data as SubRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Pagamentos</h1>
      <p className="mt-1 text-muted-foreground">{subs.length} registo(s) de pagamento.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expira em</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum pagamento registado.
                </td>
              </tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{s.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
