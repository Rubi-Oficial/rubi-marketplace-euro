import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfileFilters } from "@/hooks/useProfileFilters";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { ProfileGrid, ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { EmptyState } from "@/components/public/EmptyState";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";

export default function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const urlCountry = searchParams.get("country") || "";
  const urlCity = searchParams.get("city") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlService = searchParams.get("service") || "";

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
    filteredCities,
  } = useProfileFilters({
    limit: 50,
    initialFilters: {
      country: urlCountry,
      city: urlCity,
      category: urlCategory,
      service: urlService,
      search: searchQuery,
    },
  });

  const syncToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    setSearchParams(params);
  };

  const updateParam = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") next.city = "";
      return next;
    });
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, country: "", city: "", category: "", service: "" }));
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  const handleApplyFilters = (partial: Partial<{ category: string; service: string }>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    syncToUrl({ ...filters, ...partial });
  };

  const handleApplyLocation = (country: string, city: string) => {
    setFilters((prev) => ({ ...prev, country, city }));
    syncToUrl({ ...filters, country, city });
  };

  const handleClearGeneralFilters = () => {
    setFilters((prev) => ({ ...prev, category: "", service: "" }));
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("service");
    setSearchParams(params);
  };

  const handleRemoveFilter = (key: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: "" };
      if (key === "country") next.city = "";
      return next;
    });
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const searchTitle = cityName ? `${t("nav.explore")} in ${cityName}` : t("nav.explore");
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
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li className="text-foreground">{t("nav.explore")}</li>
        </ol>
      </nav>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("nav.search_placeholder")}
            className="pl-10 h-10 bg-card border-border/40 text-sm rounded-xl"
            value={filters.search}
            onChange={(e) => updateParam("search", e.target.value)}
            aria-label={t("nav.search_placeholder")}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className={`h-10 gap-1.5 rounded-full border-border/40 shrink-0 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
          aria-label={t("landing.filters")}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs hidden sm:inline">{t("landing.filters")}</span>
          {hasGeneralFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[filters.category, filters.service].filter(Boolean).length}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocationOpen(true)}
          className={`h-10 gap-1.5 rounded-full border-border/40 shrink-0 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
          aria-label={t("landing.location")}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs hidden sm:inline">{t("landing.location")}</span>
          {hasLocationFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[filters.country, filters.city].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      <ActiveFilterChips
        filters={{ country: filters.country, city: filters.city, category: filters.category, service: filters.service }}
        countryName={countryName}
        cityName={cityName}
        serviceName={serviceName}
        onRemove={handleRemoveFilter}
        onClearAll={clearFilters}
      />

      <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
        {loading ? t("search.loading") : [
          `${profiles.length} ${t("search.profiles")}`,
          cityName && t("search.in_city", { city: cityName }),
          serviceName && t("search.for_service", { service: serviceName }),
        ].filter(Boolean).join(" · ")}
      </p>

      {loading ? (
        <ProfileGridSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : profiles.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters || !!filters.search}
          countryFilter={filters.country}
          cityFilter={filters.city}
          serviceFilter={filters.service}
          categoryFilter={filters.category}
          onRemoveLocation={() => handleRemoveFilter("country")}
          onRemoveService={() => handleRemoveFilter("service")}
          onRemoveCategory={() => handleRemoveFilter("category")}
          onClearAll={clearFilters}
        />
      ) : (
        <ProfileGrid profiles={profiles} />
      )}

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: filters.category, service: filters.service }}
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