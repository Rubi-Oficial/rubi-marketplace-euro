import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortProfile() {
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setListing(data));
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu anúncio e informações.</p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        {listing ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Título</p>
              <p className="font-medium text-foreground">{listing.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {listing.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cidade</p>
              <p className="text-foreground">{listing.location_city || "—"}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum anúncio criado ainda.</p>
        )}
      </div>
    </div>
  );
}
