import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortMetrics() {
  const { user } = useAuth();
  const [views, setViews] = useState(0);
  const [favorites, setFavorites] = useState(0);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: listing }) => {
        if (!listing) return;

        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", listing.id)
          .eq("event_type", "view")
          .then(({ count }) => setViews(count ?? 0));

        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", listing.id)
          .then(({ count }) => setFavorites(count ?? 0));
      });
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Métricas</h1>
      <p className="mt-1 text-muted-foreground">Desempenho do seu anúncio.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Visualizações</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{views}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Favoritos</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{favorites}</p>
        </div>
      </div>
    </div>
  );
}
