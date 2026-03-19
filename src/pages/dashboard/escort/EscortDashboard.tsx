import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

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
    subStatus: null,
    subPlanName: null,
    subExpiresAt: null,
    leads: 0,
    referralCode: null,
    clicks: 0,
    signups: 0,
    commissionPending: 0,
    commissionApproved: 0,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Parallel fetch: user info, profile, subscription, affiliate data
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

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

export default function EscortDashboard() {
  const d = useDashboardData();

  const referralLink = d.referralCode
    ? `${window.location.origin}/cadastro?ref=${d.referralCode}`
    : null;

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

  const isIncomplete = !d.profile || !d.profile.display_name || !d.profile.city || !d.profile.category;
  const statusInfo = STATUS_LABELS[d.profile?.status] || STATUS_LABELS.draft;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel</h1>
        <p className="mt-1 text-muted-foreground">Gerencie seu perfil e assinatura.</p>
      </div>

      {/* Onboarding CTA */}
      {isIncomplete && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Complete seu perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu perfil ainda está incompleto. Complete o onboarding para começar.
          </p>
          <Button asChild className="mt-4"><Link to="/app/onboarding">Completar perfil</Link></Button>
        </div>
      )}

      {/* Profile & subscription overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Status do Perfil</p>
          <div className="mt-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Plano Atual</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground capitalize">
            {d.subPlanName || "Sem plano"}
          </p>
          {d.subStatus && (
            <p className="text-xs text-muted-foreground capitalize">{d.subStatus}</p>
          )}
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

      {/* Subscription expiry notice */}
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

      {/* Affiliate section */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Programa de Afiliados</h2>

        {/* Referral link */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Seu link de indicação</p>
          </div>
          {referralLink ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">
                {referralLink}
              </code>
              <Button size="sm" onClick={copyLink} className="shrink-0">
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copiar
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

      {/* Quick actions */}
      {!isIncomplete && (
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ações rápidas</h2>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <QuickLink to="/app/perfil" icon={<FileText className="h-5 w-5 text-primary" />} label="Editar perfil" />
            <QuickLink to="/app/fotos" icon={<Image className="h-5 w-5 text-primary" />} label="Gerenciar fotos" />
            <QuickLink to="/app/plano" icon={<CreditCard className="h-5 w-5 text-primary" />} label="Trocar plano" />
            <QuickLink to="/app/metricas" icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Ver métricas" />
          </div>
        </div>
      )}

      {/* Public profile link */}
      {d.profile?.status === "approved" && d.profile?.slug && d.subStatus === "active" && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">Seu perfil está público!</p>
            <p className="text-xs text-muted-foreground">/perfil/{d.profile.slug}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/perfil/${d.profile.slug}`} target="_blank">
              <Eye className="mr-1.5 h-4 w-4" /> Ver perfil
            </Link>
          </Button>
        </div>
      )}
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
