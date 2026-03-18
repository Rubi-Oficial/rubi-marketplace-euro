import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PendingListing {
  id: string;
  title: string;
  location_city: string | null;
  created_at: string;
}

export default function AdminPendingProfiles() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, location_city, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setListings((data as PendingListing[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Perfis Pendentes</h1>
      <p className="mt-1 text-muted-foreground">{listings.length} perfil(is) aguardando moderação.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Título</th>
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
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum perfil pendente.
                </td>
              </tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{l.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.location_city || "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
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
