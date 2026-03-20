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

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const code = (data?.country_code || "").toUpperCase();
        if (code) {
          sessionStorage.setItem(CACHE_KEY, code);
          setCountryCode(code);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { countryCode, loading };
}
