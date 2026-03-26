import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, SlidersHorizontal, MapPin, SearchX, X } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useEffect, useState, useMemo } from "react";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { VideoSection } from "@/components/public/VideoSection";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { useLocations } from "@/hooks/useLocations";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function LandingPage() {
  useReferralCapture();
  const { t } = useLanguage();

  usePageMeta({
    title: "Premium European Catalogue",
    description: "Rubi Girls — Premium catalogue for independent professionals across Europe. Browse verified profiles with photos and direct contact.",
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Rubi Girls",
      url: "https://rubigirls.fun",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://rubigirls.fun/buscar?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  });

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const { countries, getCitiesByCountry } = useLocations();

  const filteredCities = useMemo(
    () => (countryFilter ? getCitiesByCountry(countryFilter) : []),
    [countryFilter, getCitiesByCountry]
  );

  useEffect(() => {
    fetchServices().then(setServices).catch((err: unknown) => {
      console.error("[landing] Failed to fetch services:", err);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEligibleProfiles({
      country: countryFilter || undefined,
      city_slugs: countryFilter && !cityFilter ? filteredCities.map((c) => c.slug) : undefined,
      city_slug: cityFilter || undefined,
      category: categoryFilter || undefined,
      service_slug: serviceFilter || undefined,
      limit: 20,
      offset: 0,
    }).then((data) => {
      setProfiles(data);
      setLoading(false);
    }).catch((err: unknown) => {
      console.error("[landing] Failed to fetch profiles:", err);
      setLoading(false);
    });
  }, [cityFilter, categoryFilter, serviceFilter, countryFilter, filteredCities]);

  const hasFilters = !!countryFilter || !!cityFilter || !!categoryFilter || !!serviceFilter;
  const hasLocationFilter = !!countryFilter || !!cityFilter;
  const hasGeneralFilter = !!categoryFilter || !!serviceFilter;

  const clearFilters = () => {
    setCountryFilter("");
    setCityFilter("");
    setCategoryFilter("");
    setServiceFilter("");
  };

  const handleApplyFilters = (partial: Partial<{ category: string; service: string }>) => {
    if (partial.category !== undefined) setCategoryFilter(partial.category);
    if (partial.service !== undefined) setServiceFilter(partial.service);
  };

  const handleApplyLocation = (country: string, city: string) => {
    setCountryFilter(country);
    setCityFilter(city);
  };

  const handleRemoveFilter = (key: string) => {
    if (key === "country") { setCountryFilter(""); setCityFilter(""); }
    else if (key === "city") setCityFilter("");
    else if (key === "category") setCategoryFilter("");
    else if (key === "service") setServiceFilter("");
  };

  const countryName = countries.find((c) => c.slug === countryFilter)?.name;
  const cityName = filteredCities.find((c) => c.slug === cityFilter)?.name;
  const serviceName = services.find((s) => s.slug === serviceFilter)?.name;

  return (
    <div className="min-h-screen">
      <section className="pt-4 pb-24 md:pb-8">
        <div className="container mx-auto px-4">

          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(true)}
              className={`h-9 gap-2 rounded-full border-border/40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-xs">{t("landing.filters")}</span>
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
              className={`h-9 gap-2 rounded-full border-border/40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">{t("landing.location")}</span>
              {hasLocationFilter && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                  {[countryFilter, cityFilter].filter(Boolean).length}
                </span>
              )}
            </Button>

            <ActiveFilterChips
              filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, service: serviceFilter }}
              countryName={countryName}
              cityName={cityName}
              serviceName={serviceName}
              onRemove={handleRemoveFilter}
              onClearAll={clearFilters}
              inline
            />

            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 rounded-sm">
                {t("landing.clear_all")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="group relative block overflow-hidden rounded-xl bg-card">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <div className="flex h-full items-center justify-center text-muted-foreground/20">
                      <div className="h-14 w-14 rounded-full bg-muted-foreground/10" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-muted/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="h-4 w-24 rounded bg-muted-foreground/10 mb-1" />
                      <div className="h-3 w-16 rounded bg-muted-foreground/8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {profiles.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link to="/buscar">
                  {t("landing.view_all")} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <VideoSection filters={{ activeCity: cityFilter, activeService: serviceFilter }} />

      <section className="border-t border-border/30 py-10 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("landing.cta_title")}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("landing.cta_desc")}
          </p>
          <Button variant="premium" className="mt-5" asChild>
            <Link to="/cadastro?role=professional">
              {t("landing.cta_button")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: categoryFilter, service: serviceFilter }}
        onApply={handleApplyFilters}
        onClear={() => { setCategoryFilter(""); setServiceFilter(""); }}
        resultCount={profiles.length}
        services={services}
        categories={CATEGORIES.map((c) => t(c.key))}
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(true)}
            className={`h-10 flex-1 rounded-full border-border/50 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            {t("landing.filters")}
            {hasGeneralFilter && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {[categoryFilter, serviceFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocationOpen(true)}
            className={`h-10 flex-1 rounded-full border-border/50 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
          >
            <MapPin className="mr-2 h-3.5 w-3.5" />
            {t("landing.location")}
            {hasLocationFilter && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {[countryFilter, cityFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
