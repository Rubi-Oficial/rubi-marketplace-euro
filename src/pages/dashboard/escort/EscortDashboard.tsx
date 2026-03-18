import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FileText, Image, CreditCard } from "lucide-react";

export default function EscortDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isIncomplete = !profile || !profile.display_name || !profile.city || !profile.category;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Painel do Acompanhante</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu perfil e assinatura.</p>

      {isIncomplete && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Complete seu perfil
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu perfil ainda está incompleto. Complete o onboarding para começar a receber visitas.
          </p>
          <Button asChild className="mt-4">
            <Link to="/app/onboarding">Completar perfil</Link>
          </Button>
        </div>
      )}

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

      {!isIncomplete && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Próximos passos</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/app/perfil"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Editar perfil</span>
            </Link>
            <Link
              to="/app/fotos"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <Image className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Adicionar fotos</span>
            </Link>
            <Link
              to="/app/plano"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Escolher plano</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
