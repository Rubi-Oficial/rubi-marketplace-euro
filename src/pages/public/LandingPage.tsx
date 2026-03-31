import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useProfileFilters } from "@/hooks/useProfileFilters";
import { VideoSection } from "@/components/public/VideoSection";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { FilterBar } from "@/components/public/FilterBar";
import { MobileFilterBar } from "@/components/public/MobileFilterBar";
import { ProfileGrid, ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { EmptyState } from "@/components/public/EmptyState";
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

  const {
    filters,
    profiles,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    services,
    countries,
    getCitiesByCountry,
    hasFilters,
    hasLocationFilter,
    hasGeneralFilter,
    clearFilters,
    handleApplyFilters,
    handleApplyLocation,
    handleRemoveFilter,
    countryName,
    cityName,
    serviceName,
  } = useProfileFilters({ limit: 20 });

  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const generalCount = [filters.category, filters.service].filter(Boolean).length;
  const locationCount = [filters.country, filters.city].filter(Boolean).length;

  // Infinite scroll with IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <section className="pt-4 pb-8 md:pb-8">
        <div className="container mx-auto px-4">
          <FilterBar
            hasGeneralFilter={hasGeneralFilter}
            hasLocationFilter={hasLocationFilter}
            hasFilters={hasFilters}
            generalCount={generalCount}
            locationCount={locationCount}
            countryFilter={filters.country}
            cityFilter={filters.city}
            categoryFilter={filters.category}
            serviceFilter={filters.service}
            countryName={countryName}
            cityName={cityName}
            serviceName={serviceName}
            onOpenFilters={() => setFilterOpen(true)}
            onOpenLocation={() => setLocationOpen(true)}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={clearFilters}
          />

          {loading ? (
            <ProfileGridSkeleton count={8} />
          ) : profiles.length > 0 ? (
            <>
              <ProfileGrid profiles={profiles} />

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-1" />

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!hasMore && profiles.length > 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("landing.view_all") ?? "Todos os perfis carregados"}
                </p>
              )}
            </>
          ) : (
            <EmptyState
              hasFilters={hasFilters}
              countryFilter={filters.country}
              cityFilter={filters.city}
              serviceFilter={filters.service}
              categoryFilter={filters.category}
              onRemoveLocation={() => { handleRemoveFilter("country"); }}
              onRemoveService={() => handleRemoveFilter("service")}
              onRemoveCategory={() => handleRemoveFilter("category")}
              onClearAll={clearFilters}
            />
          )}
        </div>
      </section>

      <VideoSection filters={{ activeCity: filters.city, activeService: filters.service }} />

      <section className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 ruby-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-xl md:text-2xl font-bold text-white">
            {t("landing.cta_title")}
          </h2>
          <p className="mt-2 text-sm text-white/80 max-w-md mx-auto">
            {t("landing.cta_desc")}
          </p>
          <Button className="mt-6 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg" asChild>
            <Link to="/cadastro?role=professional">
              {t("landing.cta_button")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: filters.category, service: filters.service }}
        onApply={handleApplyFilters}
        onClear={() => { handleRemoveFilter("category"); handleRemoveFilter("service"); }}
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

      <MobileFilterBar
        hasGeneralFilter={hasGeneralFilter}
        hasLocationFilter={hasLocationFilter}
        generalCount={generalCount}
        locationCount={locationCount}
        onOpenFilters={() => setFilterOpen(true)}
        onOpenLocation={() => setLocationOpen(true)}
      />
    </div>
  );
}
