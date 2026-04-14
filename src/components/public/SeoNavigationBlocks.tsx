import { Link } from "react-router-dom";

const POPULAR_CITIES = [
  { label: "Barcelona", to: "/cidade/barcelona" },
  { label: "Madrid", to: "/cidade/madrid" },
  { label: "Paris", to: "/cidade/paris" },
  { label: "Lisbon", to: "/cidade/lisbon" },
  { label: "Milan", to: "/cidade/milan" },
  { label: "Marbella", to: "/cidade/marbella" },
];

const POPULAR_SERVICES = [
  { label: "Massagem", to: "/buscar?service=massage" },
  { label: "VIP", to: "/buscar?service=vip" },
  { label: "Jantar", to: "/buscar?service=dinner-date" },
  { label: "Viagem", to: "/buscar?service=travel-companion" },
];

const SEO_COMBINATIONS = [
  { label: "Massagem em Barcelona", to: "/es/escorts-barcelona/massagem" },
  { label: "VIP em Madrid", to: "/es/escorts-madrid/vip" },
  { label: "Jantar em Paris", to: "/es/escorts-paris/jantar" },
  { label: "Viagem em Lisbon", to: "/es/escorts-lisbon/viagem" },
  { label: "VIP em Milan", to: "/es/escorts-milan/vip" },
  { label: "VIP em Marbella", to: "/es/escorts-marbella/vip" },
];

export function SeoNavigationBlocks() {
  return (
    <section className="mt-12 grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">Cidades populares (Europa)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_CITIES.map((item) => (
            <Link key={item.to} className="rounded-full border border-border/50 px-3 py-1 text-xs hover:border-primary/40" to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">Serviços em destaque</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_SERVICES.map((item) => (
            <Link key={item.to} className="rounded-full border border-border/50 px-3 py-1 text-xs hover:border-primary/40" to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">Páginas SEO indexáveis</h2>
        <div className="mt-3 grid gap-2">
          {SEO_COMBINATIONS.map((item) => (
            <Link key={item.to} className="rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-primary/40" to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
