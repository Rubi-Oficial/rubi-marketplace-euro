import { useMemo, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, type EligibleProfile } from "@/lib/profileApi";
import { ProfileCard } from "@/components/public/ProfileCard";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { getSeoPageConfig, MARKET_LABEL, INDEX_MIN_PROFILES, LOCAL_SEO_CITIES } from "@/config/localSeoPages";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";

export default function LocalSeoPage() {
  const { market, cityBase, pageSlug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const data = useMemo(() => getSeoPageConfig(market, cityBase, pageSlug), [market, cityBase, pageSlug]);

  useEffect(() => {
    if (!data?.page) return;
    const load = async () => {
      setLoading(true);
      const result = await fetchEligibleProfiles({
        city_slug: data.city.citySlug,
        service_slug: data.page.serviceSlug,
        category: data.page.category,
        search: data.page.districtKeyword,
      });
      setProfiles(result);
      setLoading(false);
    };
    load();
  }, [data]);

  // Compute derived values defensively so hooks run unconditionally below
  const path = data?.page
    ? `${data.city.basePath}${data.page.slug ? `/${data.page.slug}` : ""}`
    : "";
  const shouldNoIndex = data?.page
    ? data.page.type !== "city" &&
      profiles.length < (data.page.indexMinProfiles ?? INDEX_MIN_PROFILES)
    : true;

  const breadcrumbs = data?.page
    ? [
        { name: "Home", url: SITE_URL },
        { name: MARKET_LABEL[data.city.market], url: `${SITE_URL}/${data.city.market}` },
        { name: data.city.cityName, url: `${SITE_URL}${data.city.basePath}` },
        ...(data.page.slug ? [{ name: data.page.h1, url: `${SITE_URL}${path}` }] : []),
      ]
    : [{ name: "Home", url: SITE_URL }];

  // Hook must always run — Rules of Hooks
  usePageMeta({
    title: data?.page?.title ?? "Página no encontrada",
    description: data?.page?.description ?? "",
    path,
    noindex: shouldNoIndex,
    breadcrumbs,
    jsonLd: data?.page
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: data.page.h1,
          description: data.page.description,
          url: `${SITE_URL}${path}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: profiles.length,
          },
        }
      : undefined,
  });

  if (!data?.page) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-2xl font-bold">Página no encontrada</h1>
      </div>
    );
  }

  const relatedLinks = data.city.pages
    .filter((p) => p.slug && p.slug !== data.page.slug)
    .slice(0, 6)
    .map((p) => ({ label: p.h1, to: `${data.city.basePath}/${p.slug}` }));
  const serviceLabel = data.page.serviceSlug ? data.page.serviceSlug.replace(/-/g, " ") : "";
  const relatedCities = LOCAL_SEO_CITIES.filter((c) => c.citySlug !== data.city.citySlug).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link to="/">Home</Link></li><li>/</li>
          <li><Link to={`/${data.city.market}`}>{MARKET_LABEL[data.city.market]}</Link></li><li>/</li>
          <li><Link to={data.city.basePath}>{data.city.cityName}</Link></li>
          {data.page.slug && <><li>/</li><li className="text-foreground">{data.page.h1}</li></>}
          {serviceLabel && <><li>/</li><li className="text-foreground capitalize">{serviceLabel}</li></>}
        </ol>
      </nav>

      <h1 className="font-display text-xl sm:text-2xl font-bold">{data.page.h1}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{data.page.intro}</p>
      <p className="mt-1 text-xs text-muted-foreground">{loading ? "Carregando perfis..." : `${profiles.length} perfis encontrados`}</p>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-xl border border-border/30 bg-card/50 p-8 text-center text-muted-foreground">
            Ainda não há inventário suficiente nesta página específica. Continue explorando a cidade.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
          </div>
        )}
      </div>

      <SeoNavigationBlocks />

      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold">Páginas relacionadas</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedLinks.map((link) => (
            <Link key={link.to} className="rounded-full border border-border/50 px-3 py-1 text-xs hover:border-primary/40" to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Outras cidades europeias</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedCities.map((city) => (
            <Link key={city.basePath} className="rounded-full border border-border/50 px-3 py-1 text-xs hover:border-primary/40" to={city.basePath}>
              {city.cityName}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-3 md:grid-cols-2">
        {data.page.faq.map((item) => (
          <article key={item.question} className="rounded-xl border border-border/30 bg-card p-4">
            <h3 className="font-medium text-sm">{item.question}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold">Anuncie na {data.city.cityName}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Publique seu perfil com destaque local e receba contatos diretos.</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">Quero anunciar <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </section>
    </div>
  );
}
