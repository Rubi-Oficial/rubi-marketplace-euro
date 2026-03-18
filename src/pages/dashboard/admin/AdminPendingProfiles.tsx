import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PendingProfile {
  id: string;
  display_name: string | null;
  city: string | null;
  created_at: string;
}

export default function AdminPendingProfiles() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, display_name, city, created_at")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProfiles((data as PendingProfile[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Perfis Pendentes</h1>
      <p className="mt-1 text-muted-foreground">{profiles.length} perfil(is) aguardando moderação.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum perfil pendente.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{p.display_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city || "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
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
