import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: string[];
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("price").then(({ data }) => {
      setPlans((data as Plan[]) ?? []);
    });

    document.title = "Planos e Preços | AURA";
    return () => { document.title = "AURA"; };
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Planos e Preços
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal e comece a receber clientes hoje mesmo. Todos os planos incluem perfil verificado e suporte.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {plans.map((plan, idx) => {
          const isFeatured = idx === plans.length - 1 || plans.length === 1;
          const period = plan.billing_period === "monthly" ? "/mês" : "/trimestre";

          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 flex flex-col ${
                isFeatured ? "border-primary bg-primary/5 glow-gold" : "border-border bg-card"
              }`}
            >
              {isFeatured && (
                <span className="mb-3 inline-flex self-start rounded-full gold-gradient px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Recomendado
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-3">
                <span className="font-display text-3xl font-bold text-primary">
                  R$ {plan.price.toLocaleString("pt-BR")}
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
                <Link to="/cadastro?role=professional">Começar Agora</Link>
              </Button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Carregando planos...
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Faça login
          </Link>{" "}
          e assine pelo painel.
        </p>
      </div>
    </div>
  );
}
