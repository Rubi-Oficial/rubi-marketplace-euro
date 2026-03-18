import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Painel do Acompanhante</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu perfil e assinatura.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Status do Perfil</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">
            {profile ? profile.status : "Sem perfil"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Cidade</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">
            {profile?.city || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Destaque</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">
            {profile?.is_featured ? "Ativo" : "Inativo"}
          </p>
        </div>
      </div>
    </div>
  );
}
