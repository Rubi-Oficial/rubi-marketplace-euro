import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, CreditCard, BarChart3, Eye } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

export default function EscortDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoStats, setPhotoStats] = useState({ approved: 0, pending: 0, total: 0 });
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [leads, setLeads] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("*")
        .eq("user_id", user.id).maybeSingle();
      setProfile(p);

      if (p) {
        // Photo stats
        const { data: imgs } = await supabase.from("profile_images")
          .select("moderation_status").eq("profile_id", p.id);
        if (imgs) {
          setPhotoStats({
            total: imgs.length,
            approved: imgs.filter((i: any) => i.moderation_status === "approved").length,
            pending: imgs.filter((i: any) => i.moderation_status === "pending").length,
          });
        }

        // Leads
        const { count } = await supabase.from("leads")
          .select("id", { count: "exact", head: true }).eq("profile_id", p.id);
        setLeads(count ?? 0);
      }

      // Subscription
      const { data: sub } = await supabase.from("subscriptions")
        .select("status").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      setSubStatus(sub?.status || null);

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isIncomplete = !profile || !profile.display_name || !profile.city || !profile.category;
  const statusInfo = STATUS_LABELS[profile?.status] || STATUS_LABELS.draft;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Painel</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu perfil e assinatura.</p>

      {isIncomplete && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Complete seu perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu perfil ainda está incompleto. Complete o onboarding para começar.
          </p>
          <Button asChild className="mt-4"><Link to="/app/onboarding">Completar perfil</Link></Button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Status do Perfil</p>
          <div className="mt-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{photoStats.approved}</p>
          <p className="text-xs text-muted-foreground">{photoStats.pending} pendente(s)</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Assinatura</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground capitalize">
            {subStatus || "Sem plano"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{leads}</p>
        </div>
      </div>

      {/* Quick actions */}
      {!isIncomplete && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ações rápidas</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/app/perfil"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Editar perfil</span>
            </Link>
            <Link to="/app/fotos"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <Image className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Gerenciar fotos</span>
            </Link>
            <Link to="/app/plano"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Plano e assinatura</span>
            </Link>
            <Link to="/app/metricas"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Ver métricas</span>
            </Link>
          </div>
        </div>
      )}

      {/* Public profile link */}
      {profile?.status === "approved" && profile?.slug && subStatus === "active" && (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Seu perfil está público!</p>
            <p className="text-xs text-muted-foreground">/perfil/{profile.slug}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/perfil/${profile.slug}`} target="_blank">
              <Eye className="mr-1.5 h-4 w-4" /> Ver perfil
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
