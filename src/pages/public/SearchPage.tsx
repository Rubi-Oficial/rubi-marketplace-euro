import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocations } from "@/hooks/useLocations";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      // If country filter is set but no city, filter client-side by country's cities
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
    // Clear city when changing country
    if (key === "country") params.delete("city");
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = !!searchQuery || !!countryFilter || !!cityFilter || !!categoryFilter || !!serviceFilter;

  useEffect(() => {
    const parts = ["Explore"];
    if (cityFilter) parts.push(`in ${cityFilter}`);
    document.title = `${parts.join(" ")} | Rubi Girls`;
    return () => { document.title = "Rubi Girls"; };
  }, [cityFilter, categoryFilter]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      {/* Search bar */}
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
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 w-10 shrink-0 ${showFilters ? "border-primary/50 text-primary" : "border-border/50"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Inline filter chips — countries then cities */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {countries.map((c) => (
          <button
            key={c.slug}
            onClick={() => updateParam("country", countryFilter === c.slug ? "" : c.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              countryFilter === c.slug
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
        {filteredCities.length > 0 && filteredCities.map((c) => (
          <button
            key={c.slug}
            onClick={() => updateParam("city", cityFilter === c.slug ? "" : c.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              cityFilter === c.slug
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
        {services.slice(0, 4).map((s) => (
          <button
            key={s.slug}
            onClick={() => updateParam("service", serviceFilter === s.slug ? "" : s.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              serviceFilter === s.slug
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-primary hover:underline">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mb-5 rounded-xl border border-border/30 bg-card/50 p-5 space-y-4">
          {countries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Country</p>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => updateParam("country", countryFilter === c.slug ? "" : c.slug)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      countryFilter === c.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filteredCities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">City</p>
              <div className="flex flex-wrap gap-2">
                {filteredCities.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => updateParam("city", cityFilter === c.slug ? "" : c.slug)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      cityFilter === c.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Services</p>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => updateParam("service", serviceFilter === s.slug ? "" : s.slug)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      serviceFilter === s.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Count */}
      <p className="mb-4 text-xs text-muted-foreground">
        {loading ? "Loading..." : `${profiles.length} profile(s)`}
      </p>

      {/* Results */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
