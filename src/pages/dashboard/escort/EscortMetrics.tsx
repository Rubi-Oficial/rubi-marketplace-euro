import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function EscortMetrics() {
  const { user } = useAuth();
  const [leads, setLeads] = useState(0);
  const [approvedImages, setApprovedImages] = useState(0);
  const [pendingImages, setPendingImages] = useState(0);
  const [rejectedImages, setRejectedImages] = useState(0);
  const [profileStatus, setProfileStatus] = useState<string>("—");

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("id, status").eq("user_id", user.id).maybeSingle()
      .then(({ data: profile }) => {
        if (!profile) return;
        setProfileStatus(profile.status);

        supabase.from("leads").select("id", { count: "exact", head: true })
          .eq("profile_id", profile.id)
          .then(({ count }) => setLeads(count ?? 0));

        supabase.from("profile_images").select("moderation_status")
          .eq("profile_id", profile.id)
          .then(({ data }) => {
            if (data) {
              setApprovedImages(data.filter((i: any) => i.moderation_status === "approved").length);
              setPendingImages(data.filter((i: any) => i.moderation_status === "pending").length);
              setRejectedImages(data.filter((i: any) => i.moderation_status === "rejected").length);
            }
          });
      });
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Métricas</h1>
      <p className="mt-1 text-muted-foreground">Desempenho do seu perfil.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads recebidos</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{leads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos aprovadas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{approvedImages}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos pendentes</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{pendingImages}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos rejeitadas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{rejectedImages}</p>
        </div>
      </div>
    </div>
  );
}
