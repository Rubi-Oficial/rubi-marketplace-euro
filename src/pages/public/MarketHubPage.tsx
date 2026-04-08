import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { LOCAL_SEO_CITIES, MARKET_HUBS, MARKET_LABEL, type SeoMarket } from "@/config/localSeoPages";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";

export default function MarketHubPage() {
  const { market } = useParams();
  const marketKey = market as SeoMarket;
  const hub = MARKET_HUBS[marketKey];

  const cities = useMemo(() => LOCAL_SEO_CITIES.filter((c) => c.market === marketKey), [marketKey]);

  if (!hub) {
    return <div className="container mx-auto px-4 py-12">Página não encontrada.</div>;
  }

  usePageMeta({
    title: hub.title,
    description: hub.description,
    path: `/${marketKey}`,
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: MARKET_LABEL[marketKey], url: `${SITE_URL}/${marketKey}` },
    ],
  });

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">{hub.h1}</h1>
      <p className="mt-2 text-muted-foreground">{hub.intro}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cities.map((city) => (
          <Link key={city.basePath} to={city.basePath} className="rounded-xl border border-border/40 bg-card p-4 hover:border-primary/40 transition-colors">
            <h2 className="font-semibold">{city.cityName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{city.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
