import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Country {
  id: string;
  name: string;
  slug: string;
  iso_code: string;
}

export interface City {
  id: string;
  country_id: string;
  name: string;
  slug: string;
  is_featured: boolean;
}

let locationsCache: { countries: Country[]; cities: City[] } | null = null;
let locationsPromise: Promise<{ countries: Country[]; cities: City[] }> | null = null;

async function fetchLocationsOnce() {
  if (locationsCache) return locationsCache;
  if (!locationsPromise) {
    locationsPromise = fetchLocations()
      .then((data) => {
        locationsCache = data;
        return data;
      })
      .finally(() => {
        locationsPromise = null;
      });
  }
  return locationsPromise;
}

export function useLocations() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationsOnce()
      .then(({ countries, cities }) => {
        setCountries(countries);
        setCities(cities);
      })
      .catch((err: unknown) => {
        console.error("[locations] Unexpected error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Pre-build O(1) lookup maps to avoid repeated linear scans across consumers
  const countryBySlug = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(c.slug, c);
    return m;
  }, [countries]);

  const citiesByCountryId = useMemo(() => {
    const m = new Map<string, City[]>();
    for (const c of cities) {
      const arr = m.get(c.country_id);
      if (arr) arr.push(c);
      else m.set(c.country_id, [c]);
    }
    return m;
  }, [cities]);

  const cityBySlug = useMemo(() => {
    const m = new Map<string, City>();
    for (const c of cities) m.set(c.slug, c);
    return m;
  }, [cities]);

  const getCitiesByCountry = useCallback((countrySlug: string) => {
    const country = countryBySlug.get(countrySlug);
    if (!country) return [];
    return citiesByCountryId.get(country.id) ?? [];
  }, [countryBySlug, citiesByCountryId]);

  const getCountryByCity = useCallback((citySlug: string) => {
    const city = cityBySlug.get(citySlug);
    if (!city) return null;
    return countries.find((c) => c.id === city.country_id) || null;
  }, [cityBySlug, countries]);

  return { countries, cities, loading, getCitiesByCountry, getCountryByCity };
}

/** Standalone fetch for use outside of React components */
export async function fetchLocations() {
  const [cRes, ciRes] = await Promise.all([
    supabase.from("countries").select("id, name, slug, iso_code").eq("is_active", true).order("sort_order"),
    supabase.from("cities").select("id, country_id, name, slug, is_featured").eq("is_active", true).order("sort_order"),
  ]);

  if (cRes.error || ciRes.error) {
    const details = [cRes.error?.message, ciRes.error?.message].filter(Boolean).join(" | ");
    throw new Error(details || "Failed to fetch locations");
  }

  return {
    countries: (cRes.data || []) as Country[],
    cities: (ciRes.data || []) as City[],
  };
}
