import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/public/ProfileCard";
import { ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { SlidersHorizontal, MapPin, ArrowRight } from "lucide-react";
import { CATEGORY_DB_VALUE_BY_SLUG, CATEGORY_DEFINITIONS } from "@/lib/categoryMapping";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";
import { useCatalogPage } from "@/hooks/useCatalogPage";

export default function CategoryPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const categoryMeta = CATEGORY_DEFINITIONS.find((c) => c.slug === slug);
  const categoryDbValue = slug ? CATEGORY_DB_VALUE_BY_SLUG[slug] : "";
  const categoryName = categoryMeta ? t(categoryMeta.key) : slug?.replace(/-/g, " ") || "";

  const {
    profiles, loading, services,
    serviceFilter, countryFilter, cityFilter,
    countryName, cityName, serviceName,
    hasLocationFilter, hasServiceFilter, hasFilters,
    handleApplyFilters, handleApplyLocation, handleRemoveFilter, clearFilters,
    countries, getCitiesByCountry,
  } = useCatalogPage({ fixedFilters: { gender: categoryDbValue || undefined } });

  usePageMeta({
    title: `${categoryName} — Profiles`,
    description: `Browse verified ${categoryName.toLowerCase()} profiles on Rubi Girls. Photos, reviews and direct contact across Europe.`,
    path: `/categoria/${slug}`,
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: "Explorar", url: `${SITE_URL}/buscar` },
      { name: categoryName, url: `${SITE_URL}/categoria/${slug}` },
      ...(countryName ? [{ name: countryName, url: `${SITE_URL}/buscar?country=${countryFilter}` }] : []),
      ...(cityName ? [{ name: cityName, url: `${SITE_URL}/buscar?country=${countryFilter}&city=${cityFilter}` }] : []),
      ...(serviceName ? [{ name: serviceName, url: `${SITE_URL}/categoria/${slug}` }] : []),
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryName} Profiles`,
      description: `Verified ${categoryName.toLowerCase()} profiles across Europe`,
      url: `${SITE_URL}/categoria/${slug}`,
      isPartOf: { "@type": "WebSite", name: "Rubi Girls", url: SITE_URL },
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li><Link to="/buscar" className="hover:text-foreground transition-colors">Explorar</Link></li>
          <li className="text-border">/</li>
          <li>
            {serviceName || cityName ? (
              <Link to={`/categoria/${slug}`} className="hover:text-foreground transition-colors">{categoryName}</Link>
            ) : (
              <span className="text-foreground">{categoryName}</span>
            )}
          </li>
          {countryName && <><li className="text-border">/</li><li>{countryName}</li></>}
          {cityName && <><li className="text-border">/</li><li>{cityName}</li></>}
          {serviceName && <><li className="text-border">/</li><li className="text-foreground">{serviceName}</li></>}
        </ol>
      </nav>

      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground capitalize sm:text-2xl">
          {categoryName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? t("search.loading") : `${profiles.length} ${t("category.profiles")}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className={`h-9 gap-2 rounded-full border-border/40 ${hasServiceFilter ? "border-primary/40 text-primary" : ""}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">{t("landing.filters")}</span>
          {hasServiceFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">1</span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocationOpen(true)}
          className={`h-9 gap-2 rounded-full border-border/40 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">{t("landing.location")}</span>
          {hasLocationFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[countryFilter, cityFilter].filter(Boolean).length}
            </span>
          )}
        </Button>

        <ActiveFilterChips
          filters={{ country: countryFilter, city: cityFilter, category: "", services: serviceFilter ? [serviceFilter] : [] }}
          countryName={countryName}
          cityName={cityName}
          serviceNames={serviceName ? [serviceName] : []}
          onRemove={(key) => handleRemoveFilter(key.startsWith("service:") ? "service" : key)}
          onClearAll={clearFilters}
          inline
        />

        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground ml-auto transition-colors">
            {t("landing.clear_all")}
          </button>
        )}
      </div>

      {loading ? (
        <ProfileGridSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">{t("category.no_profiles")}</p>
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

      {cityFilter && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold">Páginas SEO relacionadas</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Link to={`/es/escorts-${cityFilter}/massagem`} className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40">Massagem + cidade</Link>
            <Link to={`/es/escorts-${cityFilter}/vip`} className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40">VIP + cidade</Link>
            <Link to={`/es/escorts-${cityFilter}/independientes`} className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/40">Categoria + cidade</Link>
          </div>
        </section>
      )}

      <SeoNavigationBlocks />

      <section className="mt-16 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("category.cta_title")}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("category.cta_desc")}</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            {t("nav.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: "", services: serviceFilter ? [serviceFilter] : [] }}
        onApply={(p) => {
          if (p.services !== undefined) handleApplyFilters({ service: p.services[0] ?? "" });
          if (p.category !== undefined) handleApplyFilters({ category: p.category });
        }}
        onClear={() => handleApplyFilters({ service: "" })}
        resultCount={profiles.length}
        services={services}
      />

      <LocationModal
        open={locationOpen}
        onOpenChange={setLocationOpen}
        selectedCountry={countryFilter}
        selectedCity={cityFilter}
        onApply={handleApplyLocation}
        countries={countries}
        getCitiesByCountry={getCitiesByCountry}
      />
    </div>
  );
}
