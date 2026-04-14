import { Link } from "react-router-dom";

const POPULAR_CITIES = [
  { label: "Barcelona", to: "/cidade/barcelona" },
  { label: "Madrid", to: "/cidade/madrid" },
  { label: "Florianópolis", to: "/cidade/florianopolis" },
  { label: "São Paulo", to: "/cidade/sao-paulo" },
];

const POPULAR_SERVICES = [
  { label: "Massagem", to: "/buscar?service=massage" },
  { label: "VIP", to: "/buscar?service=vip" },
  { label: "Jantar", to: "/buscar?service=dinner" },
  { label: "Viagem", to: "/buscar?service=travel" },
];

export function SeoNavigationBlocks() {
  return (
    <section className="mt-12 grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">Cidades populares</h2>
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
        <h2 className="text-sm font-semibold">Acesso rápido</h2>
        <div className="mt-3 grid gap-2">
          <Link className="rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-primary/40" to="/login?redirect=/app">
            Dashboard Profissionais
          </Link>
          <Link className="rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-primary/40" to="/login?redirect=/cliente">
            Dashboard Clientes
          </Link>
          <Link className="rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-primary/40" to="/cadastro?role=professional">
            Criar anúncio profissional
          </Link>
        </div>
      </article>
    </section>
  );
}
