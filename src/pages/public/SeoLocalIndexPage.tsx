import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, Crown, Search } from "lucide-react";
import { LOCAL_SEO_CITIES } from "@/config/localSeoPages";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LOCAL_SEO_SITE_URL } from "@/config/localSeoPages";

const SERVICE_LABELS: Record<string, string> = {
  "": "Geral",
  vip: "VIP",
  massagem: "Massagem",
  jantar: "Jantar",
  viagem: "Viagem",
  independientes: "Independentes",
};

const COUNTRY_GROUPS: { name: string; cities: string[] }[] = [
  { name: "Espanha", cities: ["barcelona", "madrid", "valencia", "seville", "malaga", "bilbao", "ibiza", "marbella", "palma-de-mallorca"] },
  { name: "Portugal", cities: ["lisbon", "porto", "faro", "braga", "coimbra", "funchal", "albufeira"] },
  { name: "França", cities: ["paris", "lyon", "marseille", "nice", "toulouse", "bordeaux", "strasbourg", "cannes", "monaco"] },
  { name: "Itália", cities: ["milan", "rome", "florence", "naples", "venice", "turin", "bologna", "verona"] },
  { name: "Alemanha", cities: ["berlin", "munich", "frankfurt", "hamburg", "cologne", "dusseldorf", "stuttgart", "hanover"] },
  { name: "Holanda", cities: ["amsterdam", "rotterdam", "den-haag", "utrecht", "eindhoven", "groningen", "maastricht"] },
  { name: "Bélgica", cities: ["brussels", "antwerp", "ghent", "bruges", "liege", "leuven", "namur"] },
  { name: "Reino Unido", cities: ["london", "manchester", "birmingham", "edinburgh", "liverpool", "glasgow", "bristol", "leeds"] },
  { name: "Suíça", cities: ["zurich", "geneva", "basel", "bern", "lausanne"] },
  { name: "Áustria", cities: ["vienna", "salzburg", "innsbruck", "graz", "linz"] },
  { name: "Irlanda", cities: ["dublin", "cork", "galway", "limerick"] },
  { name: "Suécia", cities: ["stockholm", "gothenburg", "malmo", "uppsala"] },
  { name: "Dinamarca", cities: ["copenhagen", "aarhus", "odense"] },
  { name: "Noruega", cities: ["oslo", "bergen", "stavanger", "trondheim"] },
  { name: "Polónia", cities: ["warsaw", "krakow", "wroclaw", "gdansk", "poznan"] },
  { name: "República Checa", cities: ["prague", "brno", "ostrava"] },
  { name: "Grécia", cities: ["athens", "thessaloniki", "mykonos", "santorini"] },
  { name: "Luxemburgo", cities: ["luxembourg-city", "esch-sur-alzette"] },
];

export default function SeoLocalIndexPage() {
  usePageMeta({
    title: "Diretório SEO Local | Cidades × Serviços Premium na Europa",
    description: "Diretório completo com 100+ combinações de cidades europeias e serviços premium (VIP, Massagem, Jantar, Viagem). Navegação otimizada para encontrar perfis verificados.",
    path: "/seo-local",
    breadcrumbs: [
      { name: "Home", url: `${LOCAL_SEO_SITE_URL}/` },
      { name: "Diretório SEO Local", url: `${LOCAL_SEO_SITE_URL}/seo-local` },
    ],
  });

  const cityMap = useMemo(() => {
    const map = new Map<string, typeof LOCAL_SEO_CITIES[number]>();
    LOCAL_SEO_CITIES.forEach((c) => map.set(c.citySlug, c));
    return map;
  }, []);

  const totalCombinations = LOCAL_SEO_CITIES.reduce((acc, city) => acc + city.pages.length, 0);

  return (
    <main className="relative overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 bg-[hsl(274_36%_10%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(278_31%_51%_/_0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(41_49%_69%_/_0.08),transparent_55%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(41_49%_69%_/_0.3)] bg-[hsl(41_49%_69%_/_0.05)] backdrop-blur-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(41_49%_69%)]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[hsl(41_49%_69%)] font-medium">
              Diretório Premium
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 drop-shadow-[0_4px_20px_hsl(41_49%_69%_/_0.15)]">
            Diretório SEO Local
          </h1>
          <p className="text-lg text-muted-foreground/80 leading-relaxed">
            Explore <span className="text-[hsl(41_49%_69%)] font-semibold">{totalCombinations}+ combinações</span> de cidades europeias e serviços premium.
            Encontre perfis verificados em {LOCAL_SEO_CITIES.length} cidades de 18 países.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/buscar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(41_49%_69%)] text-[hsl(274_36%_10%)] font-semibold hover:scale-105 transition-transform shadow-[0_8px_32px_hsl(41_49%_69%_/_0.3)]"
            >
              <Search className="h-4 w-4" />
              Pesquisa avançada
            </Link>
            <Link
              to="/es"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[hsl(41_49%_69%_/_0.4)] text-foreground hover:bg-[hsl(41_49%_69%_/_0.1)] transition-colors backdrop-blur-sm"
            >
              <Crown className="h-4 w-4 text-[hsl(41_49%_69%)]" />
              Hub Europa
            </Link>
          </div>
        </header>

        {/* Country sections */}
        <div className="space-y-12">
          {COUNTRY_GROUPS.map((country) => {
            const countryCities = country.cities
              .map((slug) => cityMap.get(slug))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));

            if (countryCities.length === 0) return null;

            return (
              <section key={country.name} className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-[hsl(41_49%_69%_/_0.3)] to-transparent" />
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground px-2">
                    {country.name}
                  </h2>
                  <span className="text-xs uppercase tracking-[0.15em] text-[hsl(41_49%_69%)]/70">
                    {countryCities.length} {countryCities.length === 1 ? "cidade" : "cidades"}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-[hsl(41_49%_69%_/_0.3)] to-transparent" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {countryCities.map((city) => (
                    <article
                      key={city.citySlug}
                      className="group relative rounded-2xl border border-[hsl(41_49%_69%_/_0.15)] bg-[hsl(274_36%_8%_/_0.5)] backdrop-blur-sm p-5 hover:border-[hsl(41_49%_69%_/_0.4)] hover:shadow-[0_8px_32px_hsl(41_49%_69%_/_0.15)] transition-all duration-300"
                    >
                      <Link
                        to={city.basePath}
                        className="flex items-center gap-2 mb-4 group/title"
                      >
                        <MapPin className="h-4 w-4 text-[hsl(41_49%_69%)] flex-shrink-0" />
                        <h3 className="font-display text-lg font-semibold text-foreground group-hover/title:text-[hsl(41_49%_69%)] transition-colors">
                          {city.cityName}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap gap-1.5">
                        {city.pages.map((page) => {
                          const label = SERVICE_LABELS[page.slug] ?? page.slug;
                          const path = page.slug ? `${city.basePath}/${page.slug}` : city.basePath;
                          return (
                            <Link
                              key={path}
                              to={path}
                              className="inline-flex items-center px-2.5 py-1 rounded-full border border-[hsl(41_49%_69%_/_0.2)] bg-[hsl(41_49%_69%_/_0.04)] text-xs text-muted-foreground hover:border-[hsl(41_49%_69%_/_0.5)] hover:bg-[hsl(41_49%_69%_/_0.12)] hover:text-[hsl(41_49%_69%)] transition-all"
                            >
                              {label}
                            </Link>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section className="mt-20 relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(278_31%_25%)] via-[hsl(274_36%_15%)] to-[hsl(274_36%_10%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(41_49%_69%_/_0.15),transparent_60%)]" />
          <div className="relative p-10 md:p-16 text-center">
            <Crown className="h-10 w-10 text-[hsl(41_49%_69%)] mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Anuncie em qualquer cidade europeia
            </h2>
            <p className="text-muted-foreground/80 max-w-xl mx-auto mb-8">
              Junte-se a perfis premium e ganhe visibilidade em mais de 100 páginas SEO otimizadas por cidade e categoria.
            </p>
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[hsl(41_49%_69%)] text-[hsl(274_36%_10%)] font-semibold hover:scale-105 transition-transform shadow-[0_8px_32px_hsl(41_49%_69%_/_0.3)]"
            >
              Ver planos premium
            </Link>
          </div>
        </section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.3)] to-transparent" />
    </main>
  );
}
