import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, SlidersHorizontal, MapPin } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useEffect, useState, useMemo } from "react";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { VideoSection } from "@/components/public/VideoSection";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { useLocations } from "@/hooks/useLocations";
import { useGeoCountry } from "@/hooks/useGeoCountry";

export default function LandingPage() {
  useReferralCapture();

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Filter state
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [geoApplied, setGeoApplied] = useState(false);

  const { countries, getCitiesByCountry } = useLocations();
  const { countryCode } = useGeoCountry();

  // Auto-detect country from IP
  useEffect(() => {
    if (geoApplied || !countryCode || countries.length === 0) return;
    const match = countries.find((c) => c.iso_code.toUpperCase() === countryCode);
    if (match && !countryFilter) {
      setCountryFilter(match.slug);
    }
    setGeoApplied(true);
  }, [countryCode, countries, geoApplied, countryFilter]);

  const filteredCities = countryFilter ? getCitiesByCountry(countryFilter) : [];

  // Suggested cities from detected country
  const suggestedCities = useMemo(() => {
    if (!countryFilter) return [];
    return filteredCities.filter((c) => c.is_featured).slice(0, 6);
  }, [countryFilter, filteredCities]);

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEligibleProfiles({
      city_slug: cityFilter || undefined,
      category: categoryFilter || undefined,
      service_slug: serviceFilter || undefined,
    }).then((data) => {
      if (countryFilter && !cityFilter) {
        const countryCitySlugs = new Set(filteredCities.map((c) => c.slug));
        setProfiles(data.filter((p) => p.city_slug && countryCitySlugs.has(p.city_slug)).slice(0, 20));
      } else {
        setProfiles(data.slice(0, 20));
      }
      setLoading(false);
    });
  }, [cityFilter, categoryFilter, serviceFilter, countryFilter, filteredCities.length]);

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

  const detectedCountrySlug = useMemo(() => {
    if (!countryCode || countries.length === 0) return "";
    return countries.find((c) => c.iso_code.toUpperCase() === countryCode)?.slug || "";
  }, [countryCode, countries]);

  return (
    <div className="min-h-screen">
      <section className="pt-4 pb-8">
        <div className="container mx-auto px-4">

          {/* Filter buttons */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(true)}
              className={`h-9 gap-2 rounded-full border-border/40 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-xs">Filters</span>
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
              className={`h-9 gap-2 rounded-full border-border/40 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">Location</span>
              {hasLocationFilter && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                  {[countryFilter, cityFilter].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground ml-auto transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Suggested city chips */}
          {suggestedCities.length > 0 && !cityFilter && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
              <span className="text-[11px] text-muted-foreground/70 shrink-0">Suggested:</span>
              {suggestedCities.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCityFilter(c.slug)}
                  className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0 border border-border/30"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Active filter chips */}
          <ActiveFilterChips
            filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, service: serviceFilter }}
            countryName={countryName}
            cityName={cityName}
            serviceName={serviceName}
            onRemove={handleRemoveFilter}
            onClearAll={clearFilters}
          />

          {/* Profile grid */}
          {loading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="group relative block overflow-hidden rounded-xl bg-card">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <div className="flex h-full items-center justify-center text-muted-foreground/20">
                      <div className="h-14 w-14 rounded-full bg-muted-foreground/10" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
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
                  View all profiles <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <VideoSection filters={{ activeCity: cityFilter, activeService: serviceFilter }} />

      {/* CTA */}
      <section className="border-t border-border/20 py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Ready to grow your business?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create your verified profile in minutes.
          </p>
          <Button variant="premium" className="mt-5" asChild>
            <Link to="/cadastro?role=professional">
              Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Modals */}
      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: categoryFilter, service: serviceFilter }}
        onApply={handleApplyFilters}
        onClear={() => { setCategoryFilter(""); setServiceFilter(""); }}
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
        suggestedCountry={detectedCountrySlug}
      />
    </div>
  );
}
