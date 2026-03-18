import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EscortProfile() {
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
      <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu anúncio e informações.</p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        {profile ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome de exibição</p>
              <p className="font-medium text-foreground">{profile.display_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {profile.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cidade</p>
              <p className="text-foreground">{profile.city || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <p className="text-foreground">{profile.category || "—"}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum perfil criado ainda.</p>
        )}
      </div>
    </div>
  );
}
