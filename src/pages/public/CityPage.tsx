import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { buildAbsoluteUrl, buildHreflangUrls } from "@/config/site";
import { getCanonicalCityPath, shouldNoindexLegacyCity } from "@/lib/seoRoutes";

// Cities with custom microcopy keys
const CITY_OVERRIDES = new Set(["barcelona", "madrid"]);

const SEO_CITY_COPY: Record<string, { title: string; desc: string; h1: string }> = {
  barcelona: {
    title: "Escorts en Barcelona | Perfiles verificados y contacto directo",
    desc: "Descubre escorts en Barcelona con perfiles verificados, fotos y contacto directo. Explora perfiles por zona, estilo y servicio.",
    h1: "Escorts en Barcelona",
  },
  madrid: {
    title: "Escorts en Madrid | Perfiles verificados",
    desc: "Encuentra escorts en Madrid con perfiles verificados, fotos y contacto directo. Explora perfiles por zona, estilo y servicio.",
    h1: "Escorts en Madrid",
  },
  florianopolis: {
    title: "Acompanhantes em Florianópolis | Perfis verificados",
    desc: "Encontre acompanhantes em Florianópolis com perfis verificados, fotos e contato direto.",
    h1: "Acompanhantes em Florianópolis",
  },
  "sao-paulo": {
    title: "Acompanhantes em São Paulo | Contato direto",
    desc: "Explore acompanhantes em São Paulo com perfis verificados, fotos e contato direto.",
    h1: "Acompanhantes em São Paulo",
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

  // Resolve city-specific or default translation keys
  const hasOverride = slug ? CITY_OVERRIDES.has(slug) : false;
  const seoCopy = slug ? SEO_CITY_COPY[slug] : undefined;
  const metaTitle = seoCopy?.title || (hasOverride ? t(`city.meta_title_${slug}`) : t("city.meta_title_default", { city: cityName }));
  const metaDesc = seoCopy?.desc || (hasOverride ? t(`city.meta_desc_${slug}`) : t("city.meta_desc_default", { city: cityName }));
  const introText = hasOverride
    ? t(`city.intro_${slug}`)
    : t("city.intro_default", { city: cityName });
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

  const canonicalCityPath = getCanonicalCityPath(slug);
  const shouldNoindex = shouldNoindexLegacyCity(slug) && canonicalCityPath !== `/cidade/${slug}`;

  usePageMeta({
    title: metaTitle,
    description: metaDesc,
    path: canonicalCityPath,
    noindex: shouldNoindex,
    breadcrumbs: [
      { name: "Home", url: buildAbsoluteUrl("/") },
      ...(countryObj ? [{ name: countryObj.name, url: buildAbsoluteUrl(`/buscar?country=${countryObj.slug}`) }] : []),
      { name: cityName, url: buildAbsoluteUrl(canonicalCityPath) },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1Text,
      description: metaDesc,
      url: buildAbsoluteUrl(canonicalCityPath),
      about: {
        "@type": "City",
        name: cityName,
        ...(countryObj ? { containedInPlace: { "@type": "Country", name: countryObj.name } } : {}),
      },
    },
    hreflang: buildHreflangUrls(canonicalCityPath),
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
          <li className="text-foreground">{cityName}</li>
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