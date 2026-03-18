import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortDashboard() {
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setListing(data));
    }
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Painel do Acompanhante
      </h1>
      <p className="mt-1 text-muted-foreground">
        Gerencie seu anúncio e assinatura.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Status do Anúncio</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">
            {listing ? listing.status : "Sem anúncio"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Assinatura</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Visualizações</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">0</p>
        </div>
      </div>
    </div>
  );
}
