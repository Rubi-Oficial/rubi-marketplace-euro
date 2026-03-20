import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocations } from "@/hooks/useLocations";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { FilterModal } from "@/components/public/FilterModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const { countries, getCitiesByCountry } = useLocations();

  const searchQuery = searchParams.get("q") || "";
  const countryFilter = searchParams.get("country") || "";
  const cityFilter = searchParams.get("city") || "";
  const categoryFilter = searchParams.get("category") || "";
  const serviceFilter = searchParams.get("service") || "";

  const filteredCities = countryFilter ? getCitiesByCountry(countryFilter) : [];

  useEffect(() => {
    fetchServices().then(setServices);
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
    });
  }, [searchQuery, cityFilter, categoryFilter, serviceFilter, countryFilter, filteredCities.length]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = !!countryFilter || !!cityFilter || !!categoryFilter || !!serviceFilter;

  const handleApplyFilters = (partial: Partial<{ country: string; city: string; category: string; service: string }>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if ("country" in partial && partial.country !== countryFilter) params.delete("city");
    setSearchParams(params);
  };

  const handleRemoveFilter = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  // Resolve names for chips
  const countryName = countries.find((c) => c.slug === countryFilter)?.name;
  const cityName = filteredCities.find((c) => c.slug === cityFilter)?.name;
  const serviceName = services.find((s) => s.slug === serviceFilter)?.name;

  useEffect(() => {
    const parts = ["Explore"];
    if (cityName) parts.push(`in ${cityName}`);
    document.title = `${parts.join(" ")} | Rubi Girls`;
    return () => { document.title = "Rubi Girls"; };
  }, [cityName, categoryFilter]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      {/* Search bar + Filters button */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, city..."
            className="pl-10 h-10 bg-card border-border/50"
            value={searchQuery}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFilterOpen(true)}
          className={`h-10 shrink-0 gap-2 border-border/50 ${hasFilters ? "border-primary/40 text-primary" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Filters</span>
          {hasFilters && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {[countryFilter, cityFilter, categoryFilter, serviceFilter].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, service: serviceFilter }}
        countryName={countryName}
        cityName={cityName}
        serviceName={serviceName}
        onRemove={handleRemoveFilter}
        onClearAll={clearFilters}
      />

      {/* Count */}
      <p className="mb-4 text-xs text-muted-foreground">
        {loading ? "Loading..." : `${profiles.length} profile${profiles.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/30 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">
            {hasFilters ? "No profiles match your filters." : "No profiles available at the moment."}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      {/* Filter modal */}
      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, service: serviceFilter }}
        onApply={handleApplyFilters}
        onClear={clearFilters}
        resultCount={profiles.length}
        countries={countries}
        getCitiesByCountry={getCitiesByCountry}
        services={services}
      />
    </div>
  );
}
