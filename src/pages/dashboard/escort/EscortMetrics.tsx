import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortMetrics() {
  const { user } = useAuth();
  const [leads, setLeads] = useState(0);
  const [images, setImages] = useState(0);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!profile) return;

        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", profile.id)
          .then(({ count }) => setLeads(count ?? 0));

        supabase
          .from("profile_images")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", profile.id)
          .then(({ count }) => setImages(count ?? 0));
      });
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Métricas</h1>
      <p className="mt-1 text-muted-foreground">Desempenho do seu perfil.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads recebidos</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{leads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos aprovadas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{images}</p>
        </div>
      </div>
    </div>
  );
}
