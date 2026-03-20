import { useEffect, useState } from "react";

const CACHE_KEY = "rubi_geo_country";

export function useGeoCountry() {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      setCountryCode(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("geo fetch failed");
        return r.json();
      })
      .then((data) => {
        const code = typeof data?.country_code === "string" ? data.country_code.toUpperCase() : "";
        if (code) {
          sessionStorage.setItem(CACHE_KEY, code);
          setCountryCode(code);
        }
      })
      .catch(() => {
        // Silently fail — geo is non-critical
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  return { countryCode, loading };
}
