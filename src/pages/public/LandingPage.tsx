import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useProfileFilters } from "@/hooks/useProfileFilters";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { VideoSection } from "@/components/public/VideoSection";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { FilterBar } from "@/components/public/FilterBar";
import { MobileFilterBar } from "@/components/public/MobileFilterBar";
import { ProfileGrid, ProfileGridSkeleton } from "@/components/public/ProfileGrid";
import { EmptyState } from "@/components/public/EmptyState";
import { SeoNavigationBlocks } from "@/components/public/SeoNavigationBlocks";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { CATEGORIES } from "@/components/shared/CategoryBar";
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
      {/* Pull-to-refresh indicator */}
      {isMobile && pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: `${pullDistance}px` }}
        >
          <Loader2
            className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={{
              opacity: Math.min(pullDistance / 80, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}

      {/* Hero — compact on mobile, elegant on desktop */}
      <section className="relative pt-6 pb-3 md:pt-14 md:pb-8 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/12 via-accent/5 to-transparent pointer-events-none animate-gradient-shift" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,hsl(var(--primary)_/_0.08),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(278_31%_51%_/_0.04),transparent_50%)] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mx-auto mb-4 md:mb-5 h-px w-20 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-fade-in" />
          <h1 className="font-display text-[1.75rem] font-bold text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-balance animate-fade-in">
            {t("home.h1")}
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed text-pretty animate-fade-in" style={{ animationDelay: "100ms" }}>
            {t("home.subtitle")}
          </p>
          {/* Breadcrumb — desktop only */}
          <nav aria-label="Breadcrumb" className="hidden md:block mt-6 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "200ms" }}>
            <ol className="flex items-center justify-center gap-2 flex-wrap">
              <li className="text-foreground font-medium">Home</li>
              <li className="text-border/60">/</li>
              <li><Link to="/es" className="hover:text-foreground transition-colors duration-200">Europa</Link></li>
              <li className="text-border/60">/</li>
              <li><Link to="/buscar" className="hover:text-foreground transition-colors duration-200">Explorar perfis</Link></li>
            </ol>
          </nav>
        </div>
      </section>

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
              onRemoveLocation={() => { handleRemoveFilter("country"); }}
              onRemoveService={() => handleRemoveFilter("service")}
              onRemoveCategory={() => handleRemoveFilter("category")}
              onClearAll={clearFilters}
            />
          )}
        </div>
      </section>

      <VideoSection filters={{ activeCity: filters.city, activeService: filters.service }} />

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 ruby-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(41_49%_69%_/_0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
            {t("landing.cta_title")}
          </h2>
          <p className="mt-4 md:mt-5 text-sm md:text-base text-foreground/70 max-w-md mx-auto leading-relaxed text-pretty">
            {t("landing.cta_desc")}
          </p>
          <Button
            className="mt-10 md:mt-12 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-[0_8px_32px_hsl(0_0%_0%_/_0.25)] h-12 md:h-13 px-8 md:px-10 rounded-full text-sm md:text-base transition-smooth hover:shadow-[0_12px_40px_hsl(0_0%_0%_/_0.35)] hover:-translate-y-0.5 active:scale-[0.97]"
            asChild
          >
            <Link to="/cadastro?role=professional">
              {t("landing.cta_button")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

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
