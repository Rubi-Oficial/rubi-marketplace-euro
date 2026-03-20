import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { FilterModal } from "@/components/public/FilterModal";
import { LocationModal } from "@/components/public/LocationModal";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { SlidersHorizontal, MapPin, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { useLocations } from "@/hooks/useLocations";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CategoryPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const { countries, getCitiesByCountry } = useLocations();

  const categoryMeta = CATEGORIES.find((c) => c.slug === slug);
  const categoryName = categoryMeta?.label || slug?.replace(/-/g, " ") || "";

  const filteredCities = useMemo(
    () => (countryFilter ? getCitiesByCountry(countryFilter) : []),
    [countryFilter, getCitiesByCountry]
  );

  const countryCitySlugs = useMemo(
    () => new Set(filteredCities.map((c) => c.slug)),
    [filteredCities]
  );

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    if (!categoryName) return;
    setLoading(true);
    fetchEligibleProfiles({
      category: categoryName,
      service_slug: serviceFilter || undefined,
      city_slug: cityFilter || undefined,
    }).then((data) => {
      if (countryFilter && !cityFilter) {
        setProfiles(data.filter((p) => p.city_slug && countryCitySlugs.has(p.city_slug)));
      } else {
        setProfiles(data);
      }
      setLoading(false);
    });
  }, [categoryName, serviceFilter, cityFilter, countryFilter, countryCitySlugs]);

  useEffect(() => {
    document.title = `${categoryName} — Profiles | Rubi Girls`;
    return () => { document.title = "Rubi Girls"; };
  }, [categoryName]);

  const hasLocationFilter = !!countryFilter || !!cityFilter;
  const hasServiceFilter = !!serviceFilter;
  const hasFilters = hasLocationFilter || hasServiceFilter;

  const handleApplyFilters = (partial: Partial<{ category: string; service: string }>) => {
    if (partial.service !== undefined) setServiceFilter(partial.service);
  };

  const handleApplyLocation = (country: string, city: string) => {
    setCountryFilter(country);
    setCityFilter(city);
  };

  const handleRemoveFilter = (key: string) => {
    if (key === "country") { setCountryFilter(""); setCityFilter(""); }
    else if (key === "city") setCityFilter("");
    else if (key === "service") setServiceFilter("");
  };

  const clearFilters = () => {
    setServiceFilter("");
    setCountryFilter("");
    setCityFilter("");
  };

  const countryName = countries.find((c) => c.slug === countryFilter)?.name;
  const cityName = filteredCities.find((c) => c.slug === cityFilter)?.name;
  const serviceName = services.find((s) => s.slug === serviceFilter)?.name;

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground capitalize sm:text-2xl">
          {categoryName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? t("search.loading") : `${profiles.length} ${t("category.profiles")}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className={`h-9 gap-2 rounded-full border-border/40 ${hasServiceFilter ? "border-primary/40 text-primary" : ""}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="text-xs">{t("landing.filters")}</span>
          {hasServiceFilter && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">1</span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocationOpen(true)}
          className={`h-9 gap-2 rounded-full border-border/40 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
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
          filters={{ country: countryFilter, city: cityFilter, category: "", service: serviceFilter }}
          countryName={countryName}
          cityName={cityName}
          serviceName={serviceName}
          onRemove={handleRemoveFilter}
          onClearAll={clearFilters}
          inline
        />

        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground ml-auto transition-colors">
            {t("landing.clear_all")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">{t("category.no_profiles")}</p>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/buscar">{t("category.browse_all")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      <div className="mt-16 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("category.cta_title")}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("category.cta_desc")}</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            {t("nav.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={{ category: "", service: serviceFilter }}
        onApply={handleApplyFilters}
        onClear={() => setServiceFilter("")}
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
      />
    </div>
  );
}
