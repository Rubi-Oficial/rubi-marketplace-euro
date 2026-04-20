import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEligibleProfiles, prefetchNextBatchUrls, type EligibleProfile } from "@/lib/profileSearch";
import { fetchServices } from "@/lib/profileFilters";
import { useLocations } from "@/hooks/useLocations";

interface UseProfileFiltersOptions {
  limit?: number;
  initialFilters?: {
    country?: string;
    city?: string;
    category?: string;
    services?: string[];
    search?: string;
  };
  /** Fixed filter applied to every query (e.g. gender="Women"). Cannot be cleared by the user. */
  fixedFilters?: { gender?: string };
}

export interface FilterState {
  country: string;
  city: string;
  category: string;
  services: string[];
  search: string;
}

export function useProfileFilters(options: UseProfileFiltersOptions = {}) {
  const { limit = 50, initialFilters, fixedFilters } = options;
  const { countries, getCitiesByCountry } = useLocations();

  const [filters, setFilters] = useState<FilterState>({
    country: initialFilters?.country ?? "",
    city: initialFilters?.city ?? "",
    category: initialFilters?.category ?? "",
    services: initialFilters?.services ?? [],
    search: initialFilters?.search ?? "",
  });

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const offsetRef = useRef(0);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const filteredCities = useMemo(
    () => (filters.country ? getCitiesByCountry(filters.country) : []),
    [filters.country, getCitiesByCountry]
  );

  const countryObj = useMemo(
    () => countries.find((c) => c.slug === filters.country),
    [countries, filters.country]
  );

  const cityFiltersKey = useMemo(
    () => filteredCities.map((c) => c.slug).join(","),
    [filteredCities]
  );

  // Stable key for services array
  const servicesKey = useMemo(() => filters.services.join(","), [filters.services]);

  const buildFilterParams = useCallback(() => ({
    search: debouncedSearch || undefined,
    country_name: countryObj?.name || undefined,
    city_slugs: filters.country && !filters.city ? cityFiltersKey.split(",").filter(Boolean) : undefined,
    city_slug: filters.city || undefined,
    category: filters.category || undefined,
    service_slugs: filters.services.length ? filters.services : undefined,
    limit,
  }), [debouncedSearch, countryObj, filters.country, filters.city, filters.category, servicesKey, cityFiltersKey, limit]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- servicesKey replaces filters.services for stability

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    offsetRef.current = 0;

    fetchEligibleProfiles({ ...buildFilterParams(), offset: 0 })
      .then((data) => {
        setProfiles(data);
        setHasMore(data.length >= limit);
        offsetRef.current = data.length;
        setLoading(false);
        if (data.length >= limit) {
          prefetchNextBatchUrls({ ...buildFilterParams(), offset: data.length }).catch(() => {});
        }
      })
      .catch((err: unknown) => {
        console.error("[filters] Failed to fetch profiles:", err);
        setLoading(false);
      });
  }, [buildFilterParams, limit]);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    const data = await fetchEligibleProfiles({ ...buildFilterParams(), offset: 0 });
    setProfiles(data);
    setHasMore(data.length >= limit);
    offsetRef.current = data.length;
  }, [buildFilterParams, limit]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    fetchEligibleProfiles({ ...buildFilterParams(), offset: offsetRef.current })
      .then((data) => {
        setProfiles((prev) => [...prev, ...data]);
        setHasMore(data.length >= limit);
        offsetRef.current += data.length;
        setLoadingMore(false);
        if (data.length >= limit) {
          prefetchNextBatchUrls({ ...buildFilterParams(), offset: offsetRef.current }).catch(() => {});
        }
      })
      .catch((err: unknown) => {
        console.error("[filters] Failed to load more profiles:", err);
        setLoadingMore(false);
      });
  }, [loadingMore, hasMore, buildFilterParams, limit]);

  const hasFilters = !!filters.country || !!filters.city || !!filters.category || filters.services.length > 0;
  const hasLocationFilter = !!filters.country || !!filters.city;
  const hasGeneralFilter = !!filters.category || filters.services.length > 0;

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value } as FilterState;
      if (key === "country") next.city = "";
      return next;
    });
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, country: "", city: "", category: "", services: [] }));
  };

  const toggleService = useCallback((slug: string) => {
    setFilters((prev) => {
      const exists = prev.services.includes(slug);
      return {
        ...prev,
        services: exists ? prev.services.filter((s) => s !== slug) : [...prev.services, slug],
      };
    });
  }, []);

  const handleApplyFilters = (partial: Partial<{ category: string; services: string[] }>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleApplyLocation = (country: string, city: string) => {
    setFilters((prev) => ({ ...prev, country, city }));
  };

  const handleRemoveFilter = (key: string) => {
    if (key === "country") {
      setFilters((prev) => ({ ...prev, country: "", city: "" }));
    } else if (key === "services") {
      setFilters((prev) => ({ ...prev, services: [] }));
    } else if (key.startsWith("service:")) {
      const slug = key.slice("service:".length);
      setFilters((prev) => ({ ...prev, services: prev.services.filter((s) => s !== slug) }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const countryName = countryObj?.name;
  const cityName = filteredCities.find((c) => c.slug === filters.city)?.name;
  const serviceNames = useMemo(
    () => filters.services
      .map((slug) => services.find((s) => s.slug === slug)?.name)
      .filter(Boolean) as string[],
    [filters.services, services]
  );
  // Backward-compat single name (first selected) for existing chip/title displays
  const serviceName = serviceNames[0];

  return {
    filters,
    setFilters,
    profiles,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    services,
    countries,
    filteredCities,
    getCitiesByCountry,
    hasFilters,
    hasLocationFilter,
    hasGeneralFilter,
    updateFilter,
    toggleService,
    clearFilters,
    handleApplyFilters,
    handleApplyLocation,
    handleRemoveFilter,
    countryName,
    cityName,
    serviceName,
    serviceNames,
  };
}
