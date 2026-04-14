import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, Pause, Play } from "lucide-react";

interface ProfileStatusBannerProps {
  status: string;
  hasActiveSub: boolean;
  slug: string | null;
  saving: boolean;
  onPause: () => void;
  onReactivate: () => void;
}

export default function ProfileStatusBanner({
  status,
  hasActiveSub,
  slug,
  saving,
  onPause,
  onReactivate,
}: ProfileStatusBannerProps) {
  const isPublished = status === "approved" && hasActiveSub;

  return (
    <div className="space-y-0">
      {status === "rejected" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            O seu perfil foi rejeitado. Corrija as informações e reenvie para revisão.
          </p>
        </div>
      )}

      {status === "approved" && !hasActiveSub && (
        <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <p className="text-sm text-green-700">
            ✓ Perfil aprovado!{" "}
            <Link to="/app/plano" className="underline font-medium">
              Escolha um plano
            </Link>{" "}
            para publicar o seu perfil.
          </p>
        </div>
      )}

      {status === "pending_review" && (
        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-700">
            O seu perfil está em análise. Não é possível editar durante a revisão.
          </p>
        </div>
      )}

      {isPublished && (
        <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-green-700">
            ✓ Perfil publicado e visível para os visitantes.
          </p>
          <div className="flex items-center gap-2">
            {slug && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/perfil/${slug}`} target="_blank">
                  <Eye className="mr-1.5 h-4 w-4" /> Ver público
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onPause} disabled={saving}>
              <Pause className="mr-1.5 h-4 w-4" /> Despublicar
            </Button>
          </div>
        </div>
      )}

      {status === "paused" && hasActiveSub && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Perfil pausado. Não está visível para os visitantes.
          </p>
          <Button size="sm" onClick={onReactivate} disabled={saving}>
            <Play className="mr-1.5 h-4 w-4" /> Republicar
          </Button>
        </div>
      )}
    </div>
  );
}
