import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, CreditCard, Calendar, AlertCircle, XCircle, Clock, Sparkles, Zap, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: string[];
  is_active: boolean;
  tier?: string;
  is_boost?: boolean;
  highlight_days?: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  plans?: Plan;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; border: string; bg: string; iconColor: string }> = {
  active: {
    label: "Assinatura ativa",
    icon: <Check className="h-5 w-5" />,
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    iconColor: "text-green-500",
  },
  pending: {
    label: "Assinatura pendente",
    icon: <Clock className="h-5 w-5" />,
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    iconColor: "text-yellow-500",
  },
  past_due: {
    label: "Pagamento em atraso",
    icon: <AlertCircle className="h-5 w-5" />,
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
  },
  canceled: {
    label: "Assinatura cancelada",
    icon: <XCircle className="h-5 w-5" />,
    border: "border-muted-foreground/20",
    bg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
  expired: {
    label: "Assinatura expirada",
    icon: <XCircle className="h-5 w-5" />,
    border: "border-muted-foreground/20",
    bg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
};

export default function EscortSubscription() {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [boostPlans, setBoostPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [highlightTier, setHighlightTier] = useState<string>("standard");
  const [highlightExpiresAt, setHighlightExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!session?.access_token) {
      toast.error("Precisa estar autenticado.");
      return;
    }
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) {
        let serverMsg = "";
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            serverMsg = body?.error || "";
          }
        } catch { /* ignore */ }
        throw new Error(serverMsg || error.message || "Erro ao abrir portal.");
      }
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Portal de gestão aberto com sucesso.");
      } else {
        throw new Error("Não foi possível abrir o portal.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao abrir portal de gestão.");
    } finally {
      setPortalLoading(false);
    }
  };


  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") toast.success("Pagamento realizado com sucesso! O seu perfil será ativado em breve.");
    if (status === "boost_success") toast.success("Boost aplicado! O seu perfil subiu ao topo.");
    if (status === "canceled") toast.info("Checkout cancelado. Pode tentar novamente quando quiser.");
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [plansRes, subRes, profileRes] = await Promise.all([
          supabase.from("plans").select("*").eq("is_active", true).order("price"),
          supabase
            .from("subscriptions")
            .select("*, plans(*)")
            .eq("user_id", user.id)
            .in("status", ["active", "pending", "past_due"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("highlight_tier, highlight_expires_at")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (plansRes.error) {
          console.error("[EscortSubscription] Plans error:", plansRes.error.message);
          toast.error("Não foi possível carregar os planos.");
        }

        const allPlans = (plansRes.data as Plan[]) || [];
        setPlans(allPlans.filter((p) => !p.is_boost));
        setBoostPlans(allPlans.filter((p) => p.is_boost));
        setSubscription(subRes.data as Subscription | null);

        if (profileRes.data) {
          const profileData = profileRes.data as { highlight_tier?: string; highlight_expires_at?: string | null };
          setHighlightTier(profileData.highlight_tier ?? "standard");
          setHighlightExpiresAt(profileData.highlight_expires_at ?? null);
        }
      } catch (err) {
        console.error("[EscortSubscription] Unexpected error:", err);
        toast.error("Ocorreu um erro ao carregar dados da assinatura.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleCheckout = async (planId: string) => {
    if (!session?.access_token) {
      toast.error("Precisa estar autenticado para assinar.");
      return;
    }

    setCheckoutLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan_id: planId },
      });

      if (error) {
        // Parse the error body for server-side messages
        let serverMsg = "";
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            serverMsg = body?.error || "";
          }
        } catch { /* ignore parse errors */ }
        throw new Error(serverMsg || error.message || "Erro ao iniciar checkout.");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Não foi possível iniciar o checkout.");
      }
    } catch (err: any) {
      const msg = err?.message || "Erro ao iniciar checkout. Tente novamente.";
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-28 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === "active";
  const statusConfig = subscription ? STATUS_CONFIG[subscription.status] || STATUS_CONFIG.pending : null;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Assinatura</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gerencie seu plano para manter seu perfil ativo.</p>

      {/* Current subscription status */}
      {subscription && statusConfig && (
        <div className={`mt-6 rounded-lg border p-5 ${statusConfig.border} ${statusConfig.bg}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${statusConfig.iconColor}`}>
              {statusConfig.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {statusConfig.label}
              </h2>
              {subscription.plans && (
                <p className="text-sm text-muted-foreground">
                  Plano {subscription.plans.name} — €{" "}
                  {Number(subscription.plans.price).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                  /{subscription.plans.billing_period === "quarterly" ? "trimestre" : "mês"}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {subscription.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Início: {new Date(subscription.starts_at).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
                  </span>
                )}
                {subscription.expires_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Vencimento: {new Date(subscription.expires_at).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
                  </span>
                )}
              </div>
              {subscription.status === "past_due" && (
                <p className="mt-3 text-xs text-destructive">
                  O pagamento não foi processado. Atualize o seu método de pagamento para evitar a suspensão do perfil.
                </p>
              )}
              {subscription.status === "pending" && (
                <p className="mt-3 text-xs text-yellow-600">
                  O pagamento está a ser processado. Pode demorar alguns minutos.
                </p>
              )}
              {(subscription.status === "active" || subscription.status === "past_due") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={portalLoading}
                  onClick={handleManageSubscription}
                >
                  {portalLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Abrindo…
                    </span>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Gerenciar Assinatura
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          {isActive ? "Trocar plano" : "Escolher plano"}
        </h2>

        {plans.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Nenhum plano disponível no momento.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan_id === plan.id && isActive;
              const features = Array.isArray(plan.features_json) ? plan.features_json : [];

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border p-6 transition-all ${
                    isCurrentPlan
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                    {plan.billing_period === "quarterly" && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Mais popular
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="font-display text-3xl font-bold tabular-nums text-foreground">
                      €{plan.price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.billing_period === "quarterly" ? "trimestre" : "mês"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || !!checkoutLoading}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    {checkoutLoading === plan.id ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Redirecionando…
                      </span>
                    ) : isCurrentPlan ? (
                      "Plano atual"
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Assinar
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isActive && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          O seu perfil só ficará visível publicamente com uma assinatura ativa e perfil aprovado.
        </p>
      )}

      {/* ── Boost / Subida ao topo ─────────────────────────────────────── */}
      {boostPlans.length > 0 && (() => {
        const hasActiveHighlight =
          (highlightTier === "premium" || highlightTier === "exclusive") &&
          highlightExpiresAt &&
          new Date(highlightExpiresAt) > new Date();

        const tierLabel = highlightTier === "exclusive" ? "Exclusive" : "Premium";
        const tierColor = highlightTier === "exclusive" ? "text-yellow-600" : "text-purple-600";

        return (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">Boost — Subida ao Topo</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Suba o seu perfil para o topo do bloco {highlightTier !== "standard" ? tierLabel : "do seu tier"}.
              {!hasActiveHighlight && (
                <span className="ml-1 text-destructive">Necessita de um plano Premium ou Exclusive ativo.</span>
              )}
            </p>

            {hasActiveHighlight && (
              <div className="mb-4 rounded-lg border border-border bg-card p-3 flex items-center gap-2">
                <Sparkles className={`h-4 w-4 shrink-0 ${tierColor}`} />
                <p className="text-sm text-foreground">
                  Tier atual: <span className={`font-semibold ${tierColor}`}>{tierLabel}</span>
                  {highlightExpiresAt && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      — válido até {new Date(highlightExpiresAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {boostPlans.map((plan) => {
                const disabled = !hasActiveHighlight || !!checkoutLoading;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-lg border p-6 transition-all ${
                      hasActiveHighlight
                        ? "border-primary/30 bg-card hover:border-primary/60"
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <div className="mt-3">
                      <span className="font-display text-3xl font-bold tabular-nums text-foreground">
                        €{plan.price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-muted-foreground"> / por uso</span>
                    </div>
                    <Button
                      className="mt-6 w-full"
                      disabled={disabled}
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {checkoutLoading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Redirecionando…
                        </span>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Subir ao topo
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
