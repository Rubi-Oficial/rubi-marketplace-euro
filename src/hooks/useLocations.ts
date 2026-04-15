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

  const getCitiesByCountry = useCallback((countrySlug: string) => {
    const country = countries.find((c) => c.slug === countrySlug);
    if (!country) return [];
    return cities.filter((c) => c.country_id === country.id);
  }, [countries, cities]);

  const getCountryByCity = useCallback((citySlug: string) => {
    const city = cities.find((c) => c.slug === citySlug);
    if (!city) return null;
    return countries.find((c) => c.id === city.country_id) || null;
  }, [countries, cities]);

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
