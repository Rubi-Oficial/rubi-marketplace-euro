import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Image,
  CreditCard,
  BarChart3,
  Eye,
  Copy,
  Link2,
  MousePointerClick,
  UserPlus,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  Pause,
  Play,
} from "lucide-react";

/* ── Status config ── */
const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft: { label: "Rascunho", variant: "secondary", color: "text-muted-foreground" },
  pending_review: { label: "Em análise", variant: "outline", color: "text-yellow-600" },
  approved: { label: "Aprovado — aguardando ativação", variant: "default", color: "text-blue-600" },
  rejected: { label: "Rejeitado", variant: "destructive", color: "text-destructive" },
  paused: { label: "Pausado", variant: "secondary", color: "text-muted-foreground" },
};

/* ── Data hook ── */
interface DashboardData {
  profile: any;
  photoStats: { approved: number; pending: number; total: number };
  subStatus: string | null;
  subPlanName: string | null;
  subExpiresAt: string | null;
  leads: number;
  referralCode: string | null;
  clicks: number;
  signups: number;
  commissionPending: number;
  commissionApproved: number;
}

function useDashboardData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    profile: null,
    photoStats: { approved: 0, pending: 0, total: 0 },
    subStatus: null, subPlanName: null, subExpiresAt: null,
    leads: 0, referralCode: null, clicks: 0, signups: 0,
    commissionPending: 0, commissionApproved: 0,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [userRes, profileRes, subRes, clicksRes, signupsRes, conversionsRes] = await Promise.all([
        supabase.from("users").select("referral_code").eq("id", user.id).single(),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status, expires_at, plan_id, plans(name)")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", user.id),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by_user_id", user.id),
        supabase.from("referral_conversions").select("commission_amount, status").eq("referrer_user_id", user.id),
      ]);

      const profile = profileRes.data;
      let photoStats = { approved: 0, pending: 0, total: 0 };
      let leadsCount = 0;

      if (profile) {
        const [imgsRes, leadsRes] = await Promise.all([
          supabase.from("profile_images").select("moderation_status").eq("profile_id", profile.id),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
        ]);
        const imgs = imgsRes.data || [];
        photoStats = {
          total: imgs.length,
          approved: imgs.filter((i: any) => i.moderation_status === "approved").length,
          pending: imgs.filter((i: any) => i.moderation_status === "pending").length,
        };
        leadsCount = leadsRes.count ?? 0;
      }

      const conversions = conversionsRes.data || [];
      setData({
        profile,
        photoStats,
        subStatus: (subRes.data as any)?.status || null,
        subPlanName: (subRes.data as any)?.plans?.name || null,
        subExpiresAt: (subRes.data as any)?.expires_at || null,
        leads: leadsCount,
        referralCode: userRes.data?.referral_code ?? null,
        clicks: clicksRes.count ?? 0,
        signups: signupsRes.count ?? 0,
        commissionPending: conversions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0),
        commissionApproved: conversions.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.commission_amount), 0),
      });
      setLoading(false);
    };
    load();
  }, [user]);

  return { ...data, loading };
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

/* ── Flow steps ── */
function getFlowSteps(d: DashboardData) {
  const hasProfile = d.profile && d.profile.display_name && d.profile.city && d.profile.category;
  const hasPhotos = d.photoStats.total > 0;
  const status = d.profile?.status || "draft";
  const isApproved = status === "approved";
  const isPublished = isApproved && d.subStatus === "active";

  return [
    { label: "Preencher perfil", done: !!hasProfile, active: !hasProfile, path: hasProfile ? "/app/perfil" : "/app/onboarding", icon: FileText },
    { label: "Adicionar fotos", done: hasPhotos, active: !!hasProfile && !hasPhotos, path: "/app/fotos", icon: Image },
    { label: "Enviar para revisão", done: status !== "draft", active: !!hasProfile && hasPhotos && status === "draft", path: "/app/perfil", icon: Send },
    { label: "Aprovação", done: isApproved || isPublished, active: status === "pending_review", path: null, icon: CheckCircle2 },
    { label: "Ativar plano", done: d.subStatus === "active", active: isApproved && d.subStatus !== "active", path: "/app/plano", icon: CreditCard },
    { label: "Perfil publicado", done: isPublished, active: false, path: isPublished && d.profile?.slug ? `/perfil/${d.profile.slug}` : null, icon: Eye },
  ];
}

/* ── Main component ── */
export default function EscortDashboard() {
  const d = useDashboardData();
  const { user } = useAuth();

  const referralLink = d.referralCode ? `${window.location.origin}/cadastro?ref=${d.referralCode}` : null;
  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado!");
  };

  if (d.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const status = d.profile?.status || "draft";
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const isPublished = status === "approved" && d.subStatus === "active";
  const flowSteps = getFlowSteps(d);
  const completedSteps = flowSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / flowSteps.length) * 100);

  const handlePause = async () => {
    if (!d.profile?.id) return;
    const { error } = await supabase.from("profiles").update({ status: "paused" }).eq("id", d.profile.id);
    if (error) { toast.error("Erro ao pausar perfil"); return; }
    toast.success("Perfil despublicado.");
    window.location.reload();
  };

  const handleReactivate = async () => {
    if (!d.profile?.id) return;
    const { error } = await supabase.rpc("reactivate_profile", { _profile_id: d.profile.id });
    if (error) { toast.error("Erro ao reativar perfil"); return; }
    toast.success("Perfil reativado!");
    window.location.reload();
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel</h1>
        <p className="mt-1 text-muted-foreground">Gerencie seu perfil e assinatura.</p>
      </div>

      {/* ── Flow progress ── */}
      {!isPublished && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Progresso</h2>
            <span className="text-sm text-muted-foreground">{completedSteps}/{flowSteps.length} etapas</span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-5" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    step.done
                      ? "border-green-500/30 bg-green-500/5"
                      : step.active
                        ? "border-primary/40 bg-primary/5"
                        : "border-border opacity-50"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    step.done ? "bg-green-500/20 text-green-600" : step.active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    {step.active && step.path && (
                      <Link to={step.path} className="text-xs text-primary hover:underline">Ir →</Link>
                    )}
                    {step.active && !step.path && (
                      <p className="text-xs text-muted-foreground">Aguardando...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Notification banners ── */}
      {status === "approved" && d.subStatus !== "active" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-foreground">Perfil aprovado!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O seu perfil foi aprovado pela nossa equipa. Escolha um plano e realize o pagamento para publicar o seu perfil.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/app/plano"><CreditCard className="mr-1.5 h-4 w-4" /> Escolher plano</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-foreground">Perfil rejeitado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O seu perfil foi rejeitado. Corrija as informações e reenvie para revisão.
              </p>
              <Button asChild variant="outline" className="mt-3" size="sm">
                <Link to="/app/perfil"><FileText className="mr-1.5 h-4 w-4" /> Editar perfil</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === "pending_review" && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-foreground">Perfil em análise</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O seu perfil está a ser analisado pela nossa equipa. Receberá uma notificação assim que a análise for concluída.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Published banner with pause option ── */}
      {isPublished && d.profile?.slug && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Perfil publicado!</p>
                <p className="text-xs text-muted-foreground">/perfil/{d.profile.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/perfil/${d.profile.slug}`} target="_blank">
                  <Eye className="mr-1.5 h-4 w-4" /> Ver público
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePause}>
                <Pause className="mr-1.5 h-4 w-4" /> Despublicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paused banner ── */}
      {status === "paused" && d.subStatus === "active" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Pause className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Perfil pausado</p>
                <p className="text-xs text-muted-foreground">O seu perfil não está visível para os visitantes.</p>
              </div>
            </div>
            <Button size="sm" onClick={handleReactivate}>
              <Play className="mr-1.5 h-4 w-4" /> Republicar
            </Button>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Status do Perfil</p>
          <div className="mt-2">
            {isPublished ? (
              <Badge variant="default" className="bg-green-600">Publicado</Badge>
            ) : (
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Plano Atual</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground capitalize">
            {d.subPlanName || "Sem plano"}
          </p>
          {d.subStatus && <p className="text-xs text-muted-foreground capitalize">{d.subStatus}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{d.leads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Fotos</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{d.photoStats.approved}</p>
          <p className="text-xs text-muted-foreground">
            {d.photoStats.pending > 0 ? `${d.photoStats.pending} pendente(s)` : "Nenhuma pendente"}
          </p>
        </div>
      </div>

      {/* Subscription expiry */}
      {d.subExpiresAt && d.subStatus === "active" && (
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Vence em {new Date(d.subExpiresAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/plano">Gerenciar plano</Link>
          </Button>
        </div>
      )}

      {/* ── Affiliate section ── */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Programa de Afiliados</h2>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Seu link de indicação</p>
          </div>
          {referralLink ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">{referralLink}</code>
              <Button size="sm" onClick={copyLink} className="shrink-0">
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <SmallStat icon={<MousePointerClick className="h-4 w-4" />} label="Cliques" value={d.clicks.toString()} />
          <SmallStat icon={<UserPlus className="h-4 w-4" />} label="Cadastros" value={d.signups.toString()} />
          <SmallStat icon={<DollarSign className="h-4 w-4" />} label="Comissão estimada" value={fmt(d.commissionPending)} />
          <SmallStat icon={<CheckCircle2 className="h-4 w-4" />} label="Comissão aprovada" value={fmt(d.commissionApproved)} />
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ações rápidas</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/app/perfil" icon={<FileText className="h-5 w-5 text-primary" />} label="Editar perfil" />
          <QuickLink to="/app/fotos" icon={<Image className="h-5 w-5 text-primary" />} label="Fotos & Vídeos" />
          <QuickLink to="/app/preview" icon={<Eye className="h-5 w-5 text-primary" />} label="Pré-visualizar" />
          <QuickLink to="/app/plano" icon={<CreditCard className="h-5 w-5 text-primary" />} label="Plano" />
          <QuickLink to="/app/metricas" icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Métricas" />
        </div>
      </div>
    </div>
  );
}

function SmallStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      {icon}
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
