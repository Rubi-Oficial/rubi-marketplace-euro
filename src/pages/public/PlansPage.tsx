import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Shield, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: string[];
}

export default function PlansPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("price").then(({ data }) => {
      setPlans((data as Plan[]) ?? []);
    });
  }, []);

  usePageMeta({
    title: t("plans.title"),
    description: "Choose a Rubi Girls plan. Verified profile, dedicated support and full GDPR compliance. Cancel anytime.",
    path: "/planos",
  });

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("plans.title")}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          {t("plans.desc")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {plans.map((plan, idx) => {
          const isFeatured = idx === plans.length - 1 || plans.length === 1;
          const period = plan.billing_period === "monthly" ? "/mo" : "/quarter";

          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 flex flex-col ${
                isFeatured ? "border-primary bg-primary/5 glow-gold" : "border-border bg-card"
              }`}
            >
              {isFeatured && (
                <span className="mb-3 inline-flex self-start rounded-full gold-gradient px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {t("plans.most_popular")}
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-3">
                <span className="font-display text-3xl font-bold text-primary">
                  €{plan.price.toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-muted-foreground">{period}</span>
              </div>

              {Array.isArray(plan.features_json) && plan.features_json.length > 0 && (
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features_json.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant={isFeatured ? "premium" : "outline"}
                className="mt-8 w-full"
                asChild
              >
                <Link to="/cadastro?role=professional">
                  {t("plans.get_started")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
        {[
          { icon: <Shield className="h-5 w-5" />, title: t("plans.cancel_title"), desc: t("plans.cancel_desc") },
          { icon: <Zap className="h-5 w-5" />, title: t("plans.live_title"), desc: t("plans.live_desc") },
          { icon: <Users className="h-5 w-5" />, title: t("plans.referral_title"), desc: t("plans.referral_desc") },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {item.icon}
            </div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          {t("plans.already_account")}{" "}
          <Link to="/login" className="text-primary hover:underline">
            {t("nav.sign_in")}
          </Link>{" "}
          {t("plans.sign_in_subscribe")}
        </p>
      </div>
    </div>
  );
}
