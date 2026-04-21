import { Link } from "react-router-dom";

const POPULAR_CITIES = [
  { label: "Barcelona", to: "/cidade/barcelona" },
  { label: "Madrid", to: "/cidade/madrid" },
  { label: "Valencia", to: "/cidade/valencia" },
  { label: "Ibiza", to: "/cidade/ibiza" },
  { label: "Marbella", to: "/cidade/marbella" },
  { label: "Paris", to: "/cidade/paris" },
  { label: "Nice", to: "/cidade/nice" },
  { label: "Cannes", to: "/cidade/cannes" },
  { label: "Monaco", to: "/cidade/monaco" },
  { label: "Lisbon", to: "/cidade/lisbon" },
  { label: "Porto", to: "/cidade/porto" },
  { label: "Milan", to: "/cidade/milan" },
  { label: "Rome", to: "/cidade/rome" },
  { label: "Florence", to: "/cidade/florence" },
  { label: "London", to: "/cidade/london" },
  { label: "Berlin", to: "/cidade/berlin" },
  { label: "Munich", to: "/cidade/munich" },
  { label: "Amsterdam", to: "/cidade/amsterdam" },
  { label: "Brussels", to: "/cidade/brussels" },
  { label: "Vienna", to: "/cidade/vienna" },
  { label: "Zurich", to: "/cidade/zurich" },
  { label: "Geneva", to: "/cidade/geneva" },
  { label: "Prague", to: "/cidade/prague" },
  { label: "Athens", to: "/cidade/athens" },
  { label: "Mykonos", to: "/cidade/mykonos" },
  { label: "Santorini", to: "/cidade/santorini" },
  { label: "Stockholm", to: "/cidade/stockholm" },
  { label: "Copenhagen", to: "/cidade/copenhagen" },
  { label: "Dublin", to: "/cidade/dublin" },
];

const POPULAR_SERVICES = [
  { label: "Massagem", to: "/buscar?service=massage" },
  { label: "VIP", to: "/buscar?service=vip" },
  { label: "Jantar", to: "/buscar?service=dinner-date" },
  { label: "Viagem", to: "/buscar?service=travel-companion" },
  { label: "Independentes", to: "/buscar?category=independientes" },
  { label: "Premium", to: "/buscar?category=premium" },
  { label: "Exclusive", to: "/buscar?category=exclusive" },
];

const SEO_COMBINATIONS = [
  { label: "Massagem em Barcelona", to: "/es/escorts-barcelona/massagem" },
  { label: "VIP em Madrid", to: "/es/escorts-madrid/vip" },
  { label: "Independentes em Valencia", to: "/es/escorts-valencia/independientes" },
  { label: "VIP em Ibiza", to: "/es/escorts-ibiza/vip" },
  { label: "VIP em Marbella", to: "/es/escorts-marbella/vip" },
  { label: "Jantar em Paris", to: "/es/escorts-paris/jantar" },
  { label: "VIP em Nice", to: "/es/escorts-nice/vip" },
  { label: "VIP em Monaco", to: "/es/escorts-monaco/vip" },
  { label: "Viagem em Lisbon", to: "/es/escorts-lisbon/viagem" },
  { label: "Massagem em Porto", to: "/es/escorts-porto/massagem" },
  { label: "VIP em Milan", to: "/es/escorts-milan/vip" },
  { label: "Jantar em Rome", to: "/es/escorts-rome/jantar" },
  { label: "VIP em London", to: "/es/escorts-london/vip" },
  { label: "VIP em Berlin", to: "/es/escorts-berlin/vip" },
  { label: "Massagem em Munich", to: "/es/escorts-munich/massagem" },
  { label: "VIP em Amsterdam", to: "/es/escorts-amsterdam/vip" },
  { label: "Jantar em Vienna", to: "/es/escorts-vienna/jantar" },
  { label: "VIP em Zurich", to: "/es/escorts-zurich/vip" },
  { label: "VIP em Geneva", to: "/es/escorts-geneva/vip" },
  { label: "Massagem em Prague", to: "/es/escorts-prague/massagem" },
  { label: "VIP em Mykonos", to: "/es/escorts-mykonos/vip" },
  { label: "Viagem em Santorini", to: "/es/escorts-santorini/viagem" },
  { label: "Jantar em Stockholm", to: "/es/escorts-stockholm/jantar" },
  { label: "VIP em Copenhagen", to: "/es/escorts-copenhagen/vip" },
];

export function SeoNavigationBlocks() {
  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      {/* Base deep gradient — premium dark with ruby/purple depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(274_36%_10%)] via-[hsl(275_48%_18%)] to-[hsl(278_31%_12%)]" />

      {/* Ruby glow accent — top center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(278_55%_45%_/_0.35),transparent_60%)]" />

      {/* Gold luminous accent — bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(41_49%_69%_/_0.15),transparent_55%)]" />

      {/* Side vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Decorative diagonal light streak */}
      <div className="absolute -top-1/2 -right-1/4 w-[60%] h-[200%] bg-gradient-to-b from-transparent via-[hsl(41_49%_69%_/_0.06)] to-transparent rotate-12 blur-3xl pointer-events-none" />

      {/* Hairline gold dividers top + bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-px w-16 bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.7)] to-transparent" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground drop-shadow-[0_2px_20px_hsl(0_0%_0%_/_0.5)]">
            Explore nosso catálogo
          </h2>
          <p className="mt-2 text-sm text-foreground/70">
            Cidades, serviços e destinos premium em toda Europa
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[hsl(41_49%_69%_/_0.2)] bg-[hsl(274_36%_8%_/_0.5)] backdrop-blur-sm p-5 transition-all duration-300 hover:border-[hsl(41_49%_69%_/_0.5)] hover:shadow-[0_8px_32px_hsl(41_49%_69%_/_0.15)]">
            <h3 className="font-display text-base font-semibold text-[hsl(41_49%_75%)]">Cidades populares (Europa)</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((item) => (
                <Link
                  key={item.to}
                  className="rounded-full border border-[hsl(41_49%_69%_/_0.25)] bg-[hsl(274_36%_10%_/_0.4)] px-3 py-1.5 text-xs text-foreground/85 transition-all hover:border-[hsl(41_49%_69%)] hover:bg-[hsl(41_49%_69%_/_0.1)] hover:text-[hsl(41_49%_75%)]"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[hsl(41_49%_69%_/_0.2)] bg-[hsl(274_36%_8%_/_0.5)] backdrop-blur-sm p-5 transition-all duration-300 hover:border-[hsl(41_49%_69%_/_0.5)] hover:shadow-[0_8px_32px_hsl(41_49%_69%_/_0.15)]">
            <h3 className="font-display text-base font-semibold text-[hsl(41_49%_75%)]">Serviços em destaque</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_SERVICES.map((item) => (
                <Link
                  key={item.to}
                  className="rounded-full border border-[hsl(41_49%_69%_/_0.25)] bg-[hsl(274_36%_10%_/_0.4)] px-3 py-1.5 text-xs text-foreground/85 transition-all hover:border-[hsl(41_49%_69%)] hover:bg-[hsl(41_49%_69%_/_0.1)] hover:text-[hsl(41_49%_75%)]"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[hsl(41_49%_69%_/_0.2)] bg-[hsl(274_36%_8%_/_0.5)] backdrop-blur-sm p-5 transition-all duration-300 hover:border-[hsl(41_49%_69%_/_0.5)] hover:shadow-[0_8px_32px_hsl(41_49%_69%_/_0.15)]">
            <h3 className="font-display text-base font-semibold text-[hsl(41_49%_75%)]">Páginas SEO indexáveis</h3>
            <div className="mt-4 grid gap-2">
              {SEO_COMBINATIONS.map((item) => (
                <Link
                  key={item.to}
                  className="rounded-lg border border-[hsl(41_49%_69%_/_0.25)] bg-[hsl(274_36%_10%_/_0.4)] px-3 py-2 text-xs text-foreground/85 transition-all hover:border-[hsl(41_49%_69%)] hover:bg-[hsl(41_49%_69%_/_0.1)] hover:text-[hsl(41_49%_75%)]"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
