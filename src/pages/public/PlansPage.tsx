import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "Grátis",
    features: ["1 anúncio ativo", "5 fotos", "Visibilidade padrão"],
  },
  {
    name: "Premium",
    price: "€29/mês",
    featured: true,
    features: ["Anúncio destacado", "20 fotos", "Selo verificado", "Prioridade na busca", "Métricas avançadas"],
  },
  {
    name: "VIP",
    price: "€59/mês",
    features: ["Tudo do Premium", "Fotos ilimitadas", "Destaque na página inicial", "Suporte prioritário"],
  },
];

export default function PlansPage() {
  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">Planos</h1>
        <p className="mt-3 text-muted-foreground">
          Escolha o plano ideal para sua visibilidade.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-6 ${
              plan.featured
                ? "border-primary bg-primary/5 glow-gold"
                : "border-border bg-card"
            }`}
          >
            <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{plan.price}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.featured ? "premium" : "outline"}
              className="mt-8 w-full"
              asChild
            >
              <Link to="/cadastro?role=escort">Começar</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
