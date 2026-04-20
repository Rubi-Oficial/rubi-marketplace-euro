import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProfileFilters } from "@/hooks/useProfileFilters";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ProfileGrid, ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { EmptyState } from "@/components/public/EmptyState";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { FilterBar } from "@/components/public/FilterBar";
import { MobileFilterBar } from "@/components/public/MobileFilterBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";

export default function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const searchQuery = searchParams.get("q") || searchParams.get("search") || "";
  const urlCountry = searchParams.get("country") || "";
  const urlCity = searchParams.get("city") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlServicesParam = searchParams.get("services") || searchParams.get("service") || "";
  const urlServices = urlServicesParam ? urlServicesParam.split(",").filter(Boolean) : [];

  const {
    filters,
    setFilters,
    profiles,
    loading,
    services,
    countries,
    getCitiesByCountry,
    hasFilters,
    hasLocationFilter,
    hasGeneralFilter,
    countryName,
    cityName,
    serviceName,
    serviceNames,
  } = useProfileFilters({
    limit: 50,
    initialFilters: {
      country: urlCountry,
      city: urlCity,
      category: urlCategory,
      services: urlServices,
      search: searchQuery,
    },
  });

  const writeServicesParam = (params: URLSearchParams, services: string[]) => {
    params.delete("service");
    if (services.length) params.set("services", services.join(","));
    else params.delete("services");
  };

  const updateParam = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") next.city = "";
      return next;
    });
    const params = new URLSearchParams(searchParams);
    const paramKey = key === "search" ? "q" : key;
    if (value) params.set(paramKey, value);
    else params.delete(paramKey);
    if (key === "search") params.delete("search");
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, country: "", city: "", category: "", services: [] }));
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  const handleApplyFilters = (partial: Partial<{ category: string; services: string[] }>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    const params = new URLSearchParams(searchParams);
    if (partial.category !== undefined) {
      if (partial.category) params.set("category", partial.category);
      else params.delete("category");
    }
    if (partial.services !== undefined) {
      writeServicesParam(params, partial.services);
    }
    setSearchParams(params);
  };

  const handleApplyLocation = (country: string, city: string) => {
    setFilters((prev) => ({ ...prev, country, city }));
    const params = new URLSearchParams(searchParams);
    if (country) params.set("country", country);
    else params.delete("country");
    if (city) params.set("city", city);
    else params.delete("city");
    setSearchParams(params);
  };

  const handleClearGeneralFilters = () => {
    setFilters((prev) => ({ ...prev, category: "", services: [] }));
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("services");
    params.delete("service");
    setSearchParams(params);
  };

  const handleRemoveFilter = (key: string) => {
    setFilters((prev) => {
      if (key === "country") return { ...prev, country: "", city: "" };
      if (key === "services") return { ...prev, services: [] };
      if (key.startsWith("service:")) {
        const slug = key.slice("service:".length);
        return { ...prev, services: prev.services.filter((s) => s !== slug) };
      }
      return { ...prev, [key]: "" };
    });

    const params = new URLSearchParams(searchParams);
    if (key === "country") {
      params.delete("country");
      params.delete("city");
    } else if (key === "services") {
      params.delete("services");
      params.delete("service");
    } else if (key.startsWith("service:")) {
      const slug = key.slice("service:".length);
      const next = filters.services.filter((s) => s !== slug);
      writeServicesParam(params, next);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const pageHeading = cityName
    ? t("search.heading_city", { city: cityName })
    : countryName
      ? t("search.heading_country", { country: countryName })
      : t("nav.explore");

  const pageSubtitle = cityName
    ? t("search.subtitle_city", { city: cityName, country: countryName || "" })
    : countryName
      ? t("search.subtitle_country", { country: countryName })
      : t("search.subtitle_default");

  const searchTitle = cityName ? `${t("nav.explore")} in ${cityName}` : t("nav.explore");
  const generalCount = (filters.category ? 1 : 0) + filters.services.length;
  const locationCount = [filters.country, filters.city].filter(Boolean).length;

  usePageMeta({
    title: searchTitle,
    description: `Search and browse verified professional profiles on Rubi Girls${cityName ? ` in ${cityName}` : ""}. Filter by category, service and location.`,
    path: "/buscar",
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: t("nav.explore"), url: `${SITE_URL}/buscar` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      name: searchTitle,
      url: `${SITE_URL}/buscar`,
    },
  });

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="hidden md:block mb-4 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          {countryName && !cityName && <li className="text-foreground">{countryName}</li>}
          {countryName && cityName && (
            <>
              <li><button onClick={() => handleRemoveFilter("city")} className="hover:text-foreground transition-colors">{countryName}</button></li>
              <li className="text-border">/</li>
              <li className="text-foreground">{cityName}</li>
            </>
          )}
          {!countryName && <li>{(filters.services.length > 0 || filters.category) ? <Link to="/buscar" className="hover:text-foreground transition-colors">{t("nav.explore")}</Link> : <span className="text-foreground">{t("nav.explore")}</span>}</li>}
          {serviceName && (
            <>
              <li className="text-border">/</li>
              <li className="text-foreground">{serviceName}{filters.services.length > 1 ? ` +${filters.services.length - 1}` : ""}</li>
            </>
          )}
          {filters.category && (
            <>
              <li className="text-border">/</li>
              <li className="text-foreground">{filters.category}</li>
            </>
          )}
        </ol>
      </nav>

      <div className="mb-3 md:mb-4">
        <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">{pageHeading}</h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-2xl">{pageSubtitle}</p>
      </div>

      <div className="mb-4">
        <div className="relative min-w-0">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("nav.search_placeholder")}
            className="pl-10 h-10 bg-card border-border/40 text-sm rounded-xl"
            value={filters.search}
            onChange={(e) => updateParam("search", e.target.value)}
            aria-label={t("nav.search_placeholder")}
          />
        </div>
      </div>

      <MobileFilterBar
        hasGeneralFilter={hasGeneralFilter}
        hasLocationFilter={hasLocationFilter}
        generalCount={generalCount}
        locationCount={locationCount}
        onOpenFilters={() => setFilterOpen(true)}
        onOpenLocation={() => setLocationOpen(true)}
      />

      <FilterBar
        hasGeneralFilter={hasGeneralFilter}
        hasLocationFilter={hasLocationFilter}
        hasFilters={hasFilters}
        generalCount={generalCount}
        locationCount={locationCount}
        countryFilter={filters.country}
        cityFilter={filters.city}
        categoryFilter={filters.category}
        serviceFilters={filters.services}
        countryName={countryName}
        cityName={cityName}
        serviceNames={serviceNames}
        onOpenFilters={() => setFilterOpen(true)}
        onOpenLocation={() => setLocationOpen(true)}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={clearFilters}
      />

      <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
        {loading ? t("search.loading") : [
          `${profiles.length} ${t("search.profiles")}`,
          cityName && t("search.in_city", { city: cityName }),
          serviceNames.length > 0 && t("search.for_service", { service: serviceNames.join(", ") }),
        ].filter(Boolean).join(" · ")}
      </p>

      {loading ? (
        <ProfileGridSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      ) : profiles.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters || !!filters.search}
          countryFilter={filters.country}
          cityFilter={filters.city}
          serviceFilter={filters.services[0] ?? ""}
          categoryFilter={filters.category}
          onRemoveLocation={() => handleRemoveFilter("country")}
          onRemoveService={() => handleRemoveFilter("services")}
          onRemoveCategory={() => handleRemoveFilter("category")}
          onClearAll={clearFilters}
        />
      ) : (
        <ProfileGrid profiles={profiles} />
      )}

      <SeoNavigationBlocks />

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: filters.category, services: filters.services }}
        onApply={handleApplyFilters}
        onClear={handleClearGeneralFilters}
        resultCount={profiles.length}
        services={services}
        categories={CATEGORIES.map((c) => t(c.key))}
      />

      <LocationModal
        open={locationOpen}
        onOpenChange={setLocationOpen}
        selectedCountry={filters.country}
        selectedCity={filters.city}
        onApply={handleApplyLocation}
        countries={countries}
        getCitiesByCountry={getCitiesByCountry}
      />
    </div>
  );
}
