import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ArrowRight } from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";

const SEO_CITY_COPY: Record<string, { title: string; desc: string; h1: string }> = {
  barcelona: {
    title: "Serviços premium em Barcelona | Perfis verificados e contato direto",
    desc: "Descubra perfis premium em Barcelona com fotos reais e filtros por serviço.",
    h1: "Serviços premium em Barcelona",
  },
  madrid: {
    title: "Serviços premium em Madrid | Perfis verificados",
    desc: "Encontre perfis premium em Madrid com contato direto e navegação por serviço.",
    h1: "Serviços premium em Madrid",
  },
  paris: {
    title: "Serviços premium em Paris | Perfis verificados",
    desc: "Explore perfis premium em Paris com foco em turismo e demanda de alto padrão.",
    h1: "Serviços premium em Paris",
  },
  lisbon: {
    title: "Serviços premium em Lisbon | Perfis verificados",
    desc: "Navegue por perfis premium em Lisbon com filtros por Massagem, VIP, Jantar e Viagem.",
    h1: "Serviços premium em Lisbon",
  },
  milan: {
    title: "Serviços premium em Milan | Perfis verificados",
    desc: "Descubra perfis premium em Milan com links internos para categoria e serviços.",
    h1: "Serviços premium em Milan",
  },
  marbella: {
    title: "Serviços premium em Marbella | Perfis verificados",
    desc: "Explore perfis premium em Marbella com foco em turismo de luxo e vida noturna.",
    h1: "Serviços premium em Marbella",
  },
};



export default function CityPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [activeService, setActiveService] = useState<string>("");

  const { cities, countries } = useLocations();
  const cityObj = cities.find((c) => c.slug === slug);
  const cityName = cityObj?.name || slug?.replace(/-/g, " ") || "";
  const countryObj = cityObj ? countries.find((c) => c.id === cityObj.country_id) : null;
  const activeServiceObj = services.find((s) => s.slug === activeService);

  const seoCopy = slug ? SEO_CITY_COPY[slug] : undefined;
  const metaTitle = seoCopy?.title || t("city.meta_title_default", { city: cityName });
  const metaDesc = seoCopy?.desc || t("city.meta_desc_default", { city: cityName });
  const introText = seoCopy?.desc || t("city.intro_default", { city: cityName });
  const h1Text = seoCopy?.h1 || t("city.h1_default", { city: cityName });

  useEffect(() => { fetchServices().then(setServices); }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchEligibleProfiles({
      city_slug: slug,
      service_slug: activeService || undefined,
    }).then((data) => { setProfiles(data); setLoading(false); });
  }, [slug, activeService]);

  usePageMeta({
    title: metaTitle,
    description: metaDesc,
    path: `/cidade/${slug}`,
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      ...(countryObj ? [{ name: countryObj.name, url: `${SITE_URL}/buscar?country=${countryObj.slug}` }] : []),
      { name: cityName, url: `${SITE_URL}/cidade/${slug}` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1Text,
      description: metaDesc,
      url: `${SITE_URL}/cidade/${slug}`,
      about: {
        "@type": "City",
        name: cityName,
        ...(countryObj ? { containedInPlace: { "@type": "Country", name: countryObj.name } } : {}),
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          {countryObj && (
            <>
              <li><Link to={`/buscar?country=${countryObj.slug}`} className="hover:text-foreground transition-colors">{countryObj.name}</Link></li>
              <li className="text-border">/</li>
            </>
          )}
          <li>
            {activeService ? (
              <Link to={`/cidade/${slug}`} className="hover:text-foreground transition-colors">{cityName}</Link>
            ) : (
              <span className="text-foreground">{cityName}</span>
            )}
          </li>
          {activeServiceObj && (
            <>
              <li className="text-border">/</li>
              <li className="text-foreground">{activeServiceObj.name}</li>
            </>
          )}
        </ol>
      </nav>

      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{h1Text}</h1>
        {countryObj && (
          <p className="text-xs text-muted-foreground mt-0.5">{countryObj.name}</p>
        )}
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
          {introText}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {loading ? t("search.loading") : `${profiles.length} ${t("category.profiles")}`}
        </p>
      </div>

      {services.length > 0 && (
        <nav aria-label="Service filters" className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setActiveService("")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !activeService ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {t("city.all")}
          </button>
          {services.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveService(activeService === s.slug ? "" : s.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeService === s.slug ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </nav>
      )}

      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/30 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">{t("city.no_profiles")}{activeService ? t("city.no_service") : t("city.no_city")}.</p>
          {activeService && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setActiveService("")}>{t("city.clear_filter")}</Button>
          )}
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/buscar">{t("category.browse_all")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      {slug && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">Explorar por serviço em {cityName}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40" to={`/es/escorts-${slug}/massagem`}>Massagem em {cityName}</Link>
            <Link className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40" to={`/es/escorts-${slug}/vip`}>VIP em {cityName}</Link>
            <Link className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40" to={`/es/escorts-${slug}/jantar`}>Jantar em {cityName}</Link>
            <Link className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40" to={`/es/escorts-${slug}/viagem`}>Viagem em {cityName}</Link>
          </div>
        </section>
      )}

      <SeoNavigationBlocks />

      <section className="mt-14 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("city.cta_title", { city: cityName })}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("city.cta_desc")}</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            {t("nav.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
