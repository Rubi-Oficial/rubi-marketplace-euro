import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchFilterOptions, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const cityFilter = searchParams.get("city") || "";
  const categoryFilter = searchParams.get("category") || "";
  const serviceFilter = searchParams.get("service") || "";

  useEffect(() => {
    fetchFilterOptions().then(({ cities, categories }) => {
      setCities(cities);
      setCategories(categories);
    });
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEligibleProfiles({
      search: searchQuery || undefined,
      city: cityFilter || undefined,
      category: categoryFilter || undefined,
      service_slug: serviceFilter || undefined,
    }).then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, [searchQuery, cityFilter, categoryFilter, serviceFilter]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = !!searchQuery || !!cityFilter || !!categoryFilter || !!serviceFilter;

  useEffect(() => {
    const parts = ["Explore Professionals"];
    if (cityFilter) parts.push(`in ${cityFilter}`);
    if (categoryFilter) parts.push(`— ${categoryFilter}`);
    document.title = `${parts.join(" ")} | AURA`;
    return () => { document.title = "AURA"; };
  }, [cityFilter, categoryFilter]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          Explore
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? "Loading..." : `${profiles.length} profile(s) found`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, city..."
            className="pl-10 h-10 bg-card border-border/60"
            value={searchQuery}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 w-10 shrink-0 ${showFilters ? "border-primary/50 text-primary" : "border-border/60"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Inline filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {cities.slice(0, 6).map((c) => (
          <button
            key={c}
            onClick={() => updateParam("city", cityFilter === c ? "" : c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              cityFilter === c
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {c}
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

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-border/40 bg-card/50 p-5 space-y-5">
          {cities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">City</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateParam("city", cityFilter === c ? "" : c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      cityFilter === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateParam("category", categoryFilter === c ? "" : c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      categoryFilter === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
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
                      serviceFilter === s.slug
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
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

      {/* Results */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">
            {hasFilters
              ? "No profiles match your filters."
              : "No profiles available at the moment."}
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
