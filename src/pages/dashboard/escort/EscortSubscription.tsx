import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, CreditCard, Calendar, AlertCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: string[];
  is_active: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  plans?: Plan;
}

export default function EscortSubscription() {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") toast.success("Pagamento realizado com sucesso!");
    if (status === "canceled") toast.info("Checkout cancelado.");
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [plansRes, subRes] = await Promise.all([
        supabase.from("plans").select("*").eq("is_active", true).order("price"),
        supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("user_id", user.id)
          .in("status", ["active", "pending", "past_due"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setPlans((plansRes.data as Plan[]) || []);
      setSubscription(subRes.data as Subscription | null);
      setLoading(false);
    };

    load();
  }, [user]);

  const handleCheckout = async (planId: string) => {
    if (!session?.access_token) {
      toast.error("Você precisa estar logado.");
      return;
    }

    setCheckoutLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan_id: planId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isActive = subscription?.status === "active";

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Assinatura</h1>
      <p className="mt-1 text-muted-foreground">Gerencie seu plano para manter seu perfil ativo.</p>

      {/* Current subscription status */}
      {subscription && (
        <div
          className={`mt-6 rounded-lg border p-5 ${
            isActive
              ? "border-green-500/30 bg-green-500/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {isActive ? (
              <Check className="mt-0.5 h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-500" />
            )}
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {isActive ? "Assinatura ativa" : `Assinatura: ${statusLabel(subscription.status)}`}
              </h2>
              {subscription.plans && (
                <p className="text-sm text-muted-foreground">
                  Plano {subscription.plans.name} — €{" "}
                  {Number(subscription.plans.price).toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                  /{subscription.plans.billing_period === "quarterly" ? "trimestre" : "mês"}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {subscription.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Início: {new Date(subscription.starts_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {subscription.expires_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Vencimento: {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          {isActive ? "Trocar plano" : "Escolher plano"}
        </h2>

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
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  {plan.billing_period === "quarterly" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Mais popular
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="font-display text-3xl font-bold tabular-nums text-foreground">
                    €{plan.price.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{plan.billing_period === "quarterly" ? "trimestre" : "mês"}
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan || checkoutLoading === plan.id}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {checkoutLoading === plan.id ? (
                    "Redirecionando..."
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
      </div>

      {!isActive && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Seu perfil só ficará visível publicamente com uma assinatura ativa e perfil aprovado.
        </p>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    active: "Ativa",
    past_due: "Pagamento em atraso",
    canceled: "Cancelada",
    expired: "Expirada",
  };
  return map[status] || status;
}
