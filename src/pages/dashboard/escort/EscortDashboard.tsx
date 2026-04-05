import { useAuth } from "@/contexts/AuthContext";
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { StatCard } from "@/components/shared/StatCard";
import { QuickLink } from "@/components/shared/StatCard";
import { useEscortDashboardData } from "@/hooks/useEscortDashboardData";
import {
  FileText, Image, CreditCard, BarChart3, Eye, Copy, Link2,
  MousePointerClick, UserPlus, DollarSign, Clock, CheckCircle2, Send,
  AlertCircle, Pause, Play, Sparkles, Zap,
} from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

/* ── Main component ── */
const EscortDashboard = forwardRef<HTMLDivElement>(function EscortDashboard(_props, ref) {
  const d = useEscortDashboardData();
  const { user } = useAuth();
  const { t } = useLanguage();

  const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    draft: { label: t("escort.status_draft"), variant: "secondary", color: "text-muted-foreground" },
    pending_review: { label: t("escort.status_pending"), variant: "outline", color: "text-yellow-600" },
    approved: { label: t("escort.status_approved"), variant: "default", color: "text-blue-600" },
    rejected: { label: t("escort.status_rejected"), variant: "destructive", color: "text-destructive" },
    paused: { label: t("escort.status_paused"), variant: "secondary", color: "text-muted-foreground" },
  };

  const flowStepLabels = [
    t("escort.fill_profile"), t("escort.add_photos"), t("escort.submit_review"),
    t("escort.approval"), t("escort.activate_plan"), t("escort.published"),
  ];
  const flowStepIcons = [FileText, Image, Send, CheckCircle2, CreditCard, Eye];

  const referralLink = d.referralCode ? `${window.location.origin}/cadastro?ref=${d.referralCode}` : null;
  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success(t("common.copied"));
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

  const hasProfile = d.profile && d.profile.display_name && d.profile.city && d.profile.category;
  const hasPhotos = d.photoStats.total > 0;
  const isApproved = status === "approved";
  const isPublishedFull = isApproved && d.subStatus === "active";

  const flowSteps = [
    { label: flowStepLabels[0], done: !!hasProfile, active: !hasProfile, path: hasProfile ? "/app/perfil" : "/app/onboarding", icon: flowStepIcons[0] },
    { label: flowStepLabels[1], done: hasPhotos, active: !!hasProfile && !hasPhotos, path: "/app/fotos", icon: flowStepIcons[1] },
    { label: flowStepLabels[2], done: status !== "draft", active: !!hasProfile && hasPhotos && status === "draft", path: "/app/perfil", icon: flowStepIcons[2] },
    { label: flowStepLabels[3], done: isApproved || isPublishedFull, active: status === "pending_review", path: null, icon: flowStepIcons[3] },
    { label: flowStepLabels[4], done: d.subStatus === "active", active: isApproved && d.subStatus !== "active", path: "/app/plano", icon: flowStepIcons[4] },
    { label: flowStepLabels[5], done: isPublishedFull, active: false, path: isPublishedFull && d.profile?.slug ? `/perfil/${d.profile.slug}` : null, icon: flowStepIcons[5] },
  ];

  const completedSteps = flowSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / flowSteps.length) * 100);

  const handlePause = async () => {
    if (!d.profile?.id) return;
    const { error } = await supabase.from("profiles").update({ status: "paused" }).eq("id", d.profile.id);
    if (error) { toast.error(t("escort.pause_error")); return; }
    toast.success(t("escort.paused_success"));
    window.location.reload();
  };

  const handleReactivate = async () => {
    if (!d.profile?.id) return;
    const { error } = await supabase.rpc("reactivate_profile", { _profile_id: d.profile.id });
    if (error) { toast.error(t("escort.reactivate_error")); return; }
    toast.success(t("escort.reactivated"));
    window.location.reload();
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("escort.panel")}</h1>
        <p className="mt-1 text-muted-foreground">{t("escort.manage_desc")}</p>
      </div>

      {/* Flow progress */}
      {!isPublished && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">{t("escort.progress")}</h2>
            <span className="text-sm text-muted-foreground">{completedSteps}/{flowSteps.length} {t("escort.steps")}</span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-5" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${step.done ? "border-green-500/30 bg-green-500/5" : step.active ? "border-primary/40 bg-primary/5" : "border-border opacity-50"}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-green-500/20 text-green-600" : step.active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    {step.active && step.path && <Link to={step.path} className="text-xs text-primary hover:underline">{t("common.go")}</Link>}
                    {step.active && !step.path && <p className="text-xs text-muted-foreground">{t("common.waiting")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification banners */}
      {status === "approved" && d.subStatus !== "active" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-foreground">{t("escort.approved_title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("escort.approved_desc")}</p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/app/plano"><CreditCard className="mr-1.5 h-4 w-4" /> {t("escort.choose_plan")}</Link>
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
              <h3 className="font-display font-semibold text-foreground">{t("escort.rejected_title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("escort.rejected_desc")}</p>
              <Button asChild variant="outline" className="mt-3" size="sm">
                <Link to="/app/perfil"><FileText className="mr-1.5 h-4 w-4" /> {t("escort.edit_profile")}</Link>
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
              <h3 className="font-display font-semibold text-foreground">{t("escort.pending_title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("escort.pending_desc")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Published banner */}
      {isPublished && d.profile?.slug && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("escort.published_label")}</p>
                <p className="text-xs text-muted-foreground">/perfil/{d.profile.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/perfil/${d.profile.slug}`} target="_blank">
                  <Eye className="mr-1.5 h-4 w-4" /> {t("escort.view_public")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePause}>
                <Pause className="mr-1.5 h-4 w-4" /> {t("escort.unpublish")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Paused banner */}
      {status === "paused" && d.subStatus === "active" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Pause className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("escort.paused_label")}</p>
                <p className="text-xs text-muted-foreground">{t("escort.paused_desc")}</p>
              </div>
            </div>
            <Button size="sm" onClick={handleReactivate}>
              <Play className="mr-1.5 h-4 w-4" /> {t("escort.republish")}
            </Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("escort.profile_status")}</p>
          <div className="mt-2">
            {isPublished ? (
              <Badge variant="default" className="bg-green-600">{t("escort.status_published")}</Badge>
            ) : (
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("escort.current_plan")}</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground capitalize">
            {d.subPlanName || t("escort.no_plan")}
          </p>
          {d.subStatus && <p className="text-xs text-muted-foreground capitalize">{d.subStatus}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{d.leads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("escort.photos")}</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{d.photoStats.approved}</p>
          <p className="text-xs text-muted-foreground">
            {d.photoStats.pending > 0 ? t("escort.pending_photos", { count: d.photoStats.pending.toString() }) : t("escort.no_pending")}
          </p>
        </div>
      </div>

      {/* Subscription expiry */}
      {d.subExpiresAt && d.subStatus === "active" && (
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("escort.expires_on", { date: new Date(d.subExpiresAt).toLocaleDateString("pt-BR") })}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/plano">{t("escort.manage_plan")}</Link>
          </Button>
        </div>
      )}

      {/* Highlight tier status */}
      {(() => {
        const tier = d.profile?.highlight_tier;
        const expiresAt = d.profile?.highlight_expires_at;
        const isActiveTier =
          (tier === "premium" || tier === "exclusive") &&
          expiresAt &&
          new Date(expiresAt as string) > new Date();

        if (!isActiveTier) return null;

        const isExclusive = tier === "exclusive";
        const borderClass = isExclusive
          ? "border-yellow-500/40 bg-yellow-500/5"
          : "border-purple-500/40 bg-purple-500/5";
        const iconClass = isExclusive ? "text-yellow-500" : "text-purple-500";
        const label = isExclusive ? "Exclusive" : "Premium";

        return (
          <div className={`rounded-lg border p-4 ${borderClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className={`h-5 w-5 shrink-0 ${iconClass}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Destaque {label} ativo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Válido até {new Date(expiresAt as string).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/plano">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Subir ao topo
                </Link>
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Affiliate section */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("escort.affiliate_program")}</h2>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">{t("escort.referral_link")}</p>
          </div>
          {referralLink ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">{referralLink}</code>
              <Button size="sm" onClick={copyLink} className="shrink-0">
                <Copy className="mr-1.5 h-3.5 w-3.5" /> {t("common.copy")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          )}
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<MousePointerClick className="h-4 w-4" />} label={t("escort.clicks")} value={d.clicks.toString()} />
          <StatCard icon={<UserPlus className="h-4 w-4" />} label={t("escort.signups")} value={d.signups.toString()} />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label={t("escort.estimated_commission")} value={fmt(d.commissionPending)} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label={t("escort.approved_commission")} value={fmt(d.commissionApproved)} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("escort.quick_actions")}</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/app/perfil" icon={<FileText className="h-5 w-5 text-primary" />} label={t("escort.edit_profile")} />
          <QuickLink to="/app/fotos" icon={<Image className="h-5 w-5 text-primary" />} label={t("dash.photos_videos")} />
          <QuickLink to="/app/preview" icon={<Eye className="h-5 w-5 text-primary" />} label={t("dash.preview")} />
          <QuickLink to="/app/plano" icon={<CreditCard className="h-5 w-5 text-primary" />} label={t("dash.plan")} />
          <QuickLink to="/app/metricas" icon={<BarChart3 className="h-5 w-5 text-primary" />} label={t("dash.metrics")} />
        </div>
      </div>
    </div>
  );
});

export default EscortDashboard;
