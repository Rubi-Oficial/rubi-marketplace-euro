import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useProfileFilters } from "@/hooks/useProfileFilters";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { LazyVideoSection } from "@/components/public/LazyVideoSection";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { FilterBar } from "@/components/public/FilterBar";
import { MobileFilterBar } from "@/components/public/MobileFilterBar";
import { ProfileGrid, ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { EmptyState } from "@/components/public/EmptyState";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { HeroSection } from "@/components/public/HeroSection";
import { CtaSection } from "@/components/public/CtaSection";
import { PullToRefreshIndicator } from "@/components/public/PullToRefreshIndicator";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function LandingPage() {
  useReferralCapture();
  const { t } = useLanguage();

  usePageMeta({
    title: t("home.meta_title"),
    description: t("home.meta_desc"),
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Velvet Escorts",
      url: "https://velvetescorts.vip",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://velvetescorts.vip/buscar?q={search_term_string}",
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
    refresh,
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
    serviceNames,
  } = useProfileFilters({ limit: 20, fixedFilters: { gender: "Women" } });

  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const isMobile = useIsMobile();

  const openFilters = useCallback(() => setFilterOpen(true), []);
  const openLocation = useCallback(() => setLocationOpen(true), []);
  const clearCategoryService = useCallback(() => {
    handleRemoveFilter("category");
    handleRemoveFilter("services");
  }, [handleRemoveFilter]);
  const removeCountry = useCallback(() => handleRemoveFilter("country"), [handleRemoveFilter]);
  const removeService = useCallback(() => handleRemoveFilter("services"), [handleRemoveFilter]);
  const removeCategory = useCallback(() => handleRemoveFilter("category"), [handleRemoveFilter]);

  const { containerRef: pullRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: refresh,
  });

  const generalCount = (filters.category ? 1 : 0) + filters.services.length;
  const locationCount = [filters.country, filters.city].filter(Boolean).length;

  // Contextual heading shown when location filter is active
  const contextualHeading = cityName
    ? t("search.heading_city", { city: cityName })
    : countryName
      ? t("search.heading_country", { country: countryName })
      : null;

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
    <div className="min-h-screen pb-0" ref={isMobile ? pullRef : undefined}>
      {isMobile && <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />}

      <HeroSection />

      <section className="pt-2 pb-8 md:pb-10">
        <div className="container mx-auto px-4">
          {contextualHeading && (
            <div className="mb-4 md:mb-6 animate-fade-in">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {contextualHeading}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {!loading && `${profiles.length} ${t("search.profiles")}`}
              </p>
            </div>
          )}

          <MobileFilterBar
            hasGeneralFilter={hasGeneralFilter}
            hasLocationFilter={hasLocationFilter}
            generalCount={generalCount}
            locationCount={locationCount}
            onOpenFilters={openFilters}
            onOpenLocation={openLocation}
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
            onOpenFilters={openFilters}
            onOpenLocation={openLocation}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={clearFilters}
          />

          <SectionErrorBoundary section="perfis">
            {loading ? (
              <ProfileGridSkeleton count={8} />
            ) : profiles.length > 0 ? (
              <>
                <ProfileGrid profiles={profiles} />
                <div ref={sentinelRef} className="h-1" />
                {loadingMore && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!hasMore && profiles.length > 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("landing.view_all") ?? "Todos os perfis carregados"}
                  </p>
                )}
              </>
            ) : (
              <EmptyState
                hasFilters={hasFilters}
                countryFilter={filters.country}
                cityFilter={filters.city}
                serviceFilter={filters.services[0] ?? ""}
                categoryFilter={filters.category}
                onRemoveLocation={removeCountry}
                onRemoveService={removeService}
                onRemoveCategory={removeCategory}
                onClearAll={clearFilters}
              />
            )}
          </SectionErrorBoundary>
        </div>
      </section>

      <LazyVideoSection filters={{ activeCity: filters.city, activeService: filters.services[0] }} />

      <CtaSection />

      <SeoNavigationBlocks />
      <ScrollToTop />

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: filters.category, services: filters.services }}
        onApply={handleApplyFilters}
        onClear={clearCategoryService}
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
