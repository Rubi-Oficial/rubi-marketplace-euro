import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    serviceName,
  } = useProfileFilters({ limit: 20 });

  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const isMobile = useIsMobile();

  const { containerRef: pullRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: refresh,
  });

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
    <div className="min-h-screen pb-0" ref={isMobile ? pullRef : undefined}>
      {isMobile && <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />}

      <HeroSection />

      <section className="pt-2 pb-8 md:pb-10">
        <div className="container mx-auto px-4">
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
            serviceFilter={filters.service}
            countryName={countryName}
            cityName={cityName}
            serviceName={serviceName}
            onOpenFilters={() => setFilterOpen(true)}
            onOpenLocation={() => setLocationOpen(true)}
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
                serviceFilter={filters.service}
                categoryFilter={filters.category}
                onRemoveLocation={() => handleRemoveFilter("country")}
                onRemoveService={() => handleRemoveFilter("service")}
                onRemoveCategory={() => handleRemoveFilter("category")}
                onClearAll={clearFilters}
              />
            )}
          </SectionErrorBoundary>
        </div>
      </section>

      <LazyVideoSection filters={{ activeCity: filters.city, activeService: filters.service }} />

      <CtaSection />

      <SeoNavigationBlocks />
      <ScrollToTop />

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
    </div>
  );
}
