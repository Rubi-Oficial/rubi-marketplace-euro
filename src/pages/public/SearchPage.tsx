import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocations } from "@/hooks/useLocations";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const { countries, getCitiesByCountry } = useLocations();

  const searchQuery = searchParams.get("q") || "";
  const countryFilter = searchParams.get("country") || "";
  const cityFilter = searchParams.get("city") || "";
  const categoryFilter = searchParams.get("category") || "";
  const serviceFilter = searchParams.get("service") || "";

  const filteredCities = countryFilter ? getCitiesByCountry(countryFilter) : [];

  useEffect(() => {
    fetchServices().then(setServices).catch((err: unknown) => {
      console.error("[search] Failed to fetch services:", err);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEligibleProfiles({
      search: searchQuery || undefined,
      city_slug: cityFilter || undefined,
      category: categoryFilter || undefined,
      service_slug: serviceFilter || undefined,
    }).then((data) => {
      if (countryFilter && !cityFilter) {
        const countryCitySlugs = new Set(filteredCities.map((c) => c.slug));
        setProfiles(data.filter((p) => p.city_slug && countryCitySlugs.has(p.city_slug)));
      } else {
        setProfiles(data);
      }
      setLoading(false);
    }).catch((err: unknown) => {
      console.error("[search] Failed to fetch profiles:", err);
      setLoading(false);
    });
  }, [searchQuery, cityFilter, categoryFilter, serviceFilter, countryFilter, filteredCities.length]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams(searchQuery ? { q: searchQuery } : {});
  const hasFilters = !!countryFilter || !!cityFilter || !!categoryFilter || !!serviceFilter;
  const hasLocationFilter = !!countryFilter || !!cityFilter;
  const hasGeneralFilter = !!categoryFilter || !!serviceFilter;

  const handleApplyFilters = (partial: Partial<{ category: string; service: string }>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    setSearchParams(params);
  };

  const handleApplyLocation = (country: string, city: string) => {
    const params = new URLSearchParams(searchParams);
    if (country) params.set("country", country);
    else params.delete("country");
    if (city) params.set("city", city);
    else params.delete("city");
    setSearchParams(params);
  };

  const handleClearGeneralFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("service");
    setSearchParams(params);
  };

  const handleRemoveFilter = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const countryName = countries.find((c) => c.slug === countryFilter)?.name;
  const cityName = filteredCities.find((c) => c.slug === cityFilter)?.name;
  const serviceName = services.find((s) => s.slug === serviceFilter)?.name;

  const searchTitle = cityName ? `${t("nav.explore")} in ${cityName}` : t("nav.explore");
  usePageMeta({
    title: searchTitle,
    description: `Search and browse verified professional profiles on Rubi Girls${cityName ? ` in ${cityName}` : ""}. Filter by category, service and location.`,
    path: "/buscar",
  });

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("nav.search_placeholder")}
            className="pl-10 h-10 bg-card border-border/40 text-sm rounded-xl"
            value={searchQuery}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className={`h-10 gap-1.5 rounded-full border-border/40 shrink-0 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">{t("landing.filters")}</span>
          {hasGeneralFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[categoryFilter, serviceFilter].filter(Boolean).length}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocationOpen(true)}
          className={`h-10 gap-1.5 rounded-full border-border/40 shrink-0 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">{t("landing.location")}</span>
          {hasLocationFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[countryFilter, cityFilter].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      <ActiveFilterChips
        filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, service: serviceFilter }}
        countryName={countryName}
        cityName={cityName}
        serviceName={serviceName}
        onRemove={handleRemoveFilter}
        onClearAll={clearFilters}
      />

      <p className="mb-4 text-xs text-muted-foreground">
        {loading ? t("search.loading") : `${profiles.length} ${t("search.profiles")}`}
      </p>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-16 text-center shadow-sm">
          <p className="text-muted-foreground">
            {hasFilters ? t("search.no_match") : t("search.no_filters")}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={clearFilters}>
              {t("search.clear_filters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: categoryFilter, service: serviceFilter }}
        onApply={handleApplyFilters}
        onClear={handleClearGeneralFilters}
        resultCount={profiles.length}
        services={services}
        categories={CATEGORIES.map((c) => c.label)}
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
