import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchEligibleProfiles, fetchServices, type EligibleProfile } from "@/lib/profileApi";
import { useLocations } from "@/hooks/useLocations";

interface UseCatalogPageOptions {
  /** Fixed filter applied to every query (e.g. city_slug or gender) */
  fixedFilters?: Record<string, string | undefined>;
}

export function useCatalogPage(options: UseCatalogPageOptions = {}) {
  const { fixedFilters } = options;
  const { countries, getCitiesByCountry } = useLocations();

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const filteredCities = useMemo(
    () => (countryFilter ? getCitiesByCountry(countryFilter) : []),
    [countryFilter, getCitiesByCountry]
  );

  const countryCitySlugs = useMemo(
    () => new Set(filteredCities.map((c) => c.slug)),
    [filteredCities]
  );

  // Stable serialisation of fixedFilters to use as effect dep
  const fixedKey = JSON.stringify(fixedFilters ?? {});

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    const parsed = JSON.parse(fixedKey) as Record<string, string | undefined>;
    setLoading(true);
    fetchEligibleProfiles({
      ...parsed,
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
  }, [fixedKey, serviceFilter, cityFilter, countryFilter, countryCitySlugs]);

  // Derived names
  const countryName = countries.find((c) => c.slug === countryFilter)?.name;
  const cityName = filteredCities.find((c) => c.slug === cityFilter)?.name;
  const serviceName = services.find((s) => s.slug === serviceFilter)?.name;

  const hasLocationFilter = !!countryFilter || !!cityFilter;
  const hasServiceFilter = !!serviceFilter;
  const hasFilters = hasLocationFilter || hasServiceFilter;

  const handleApplyFilters = useCallback(
    (partial: Partial<{ category: string; service: string }>) => {
      if (partial.service !== undefined) setServiceFilter(partial.service);
    },
    []
  );

  const handleApplyLocation = useCallback((country: string, city: string) => {
    setCountryFilter(country);
    setCityFilter(city);
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    if (key === "country") { setCountryFilter(""); setCityFilter(""); }
    else if (key === "city") setCityFilter("");
    else if (key === "service") setServiceFilter("");
  }, []);

  const clearFilters = useCallback(() => {
    setServiceFilter("");
    setCountryFilter("");
    setCityFilter("");
  }, []);

  return {
    profiles,
    loading,
    services,
    serviceFilter,
    setServiceFilter,
    countryFilter,
    cityFilter,
    filteredCities,
    countries,
    getCitiesByCountry,
    countryName,
    cityName,
    serviceName,
    hasLocationFilter,
    hasServiceFilter,
    hasFilters,
    handleApplyFilters,
    handleApplyLocation,
    handleRemoveFilter,
    clearFilters,
  };
}
