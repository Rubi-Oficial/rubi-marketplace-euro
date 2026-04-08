/**
 * Shared SEO configuration for Supabase Edge Functions.
 * This mirrors the minimal subset of src/config/site.shared.ts and
 * src/config/localSeoPages.ts needed by edge functions (e.g. sitemap).
 * Keep in sync with the frontend config when cities/markets change.
 */

export const SITE_URL_DEFAULT = "https://rubigirls.fun";

export interface SeoCityEntry {
  citySlug: string;
  basePath: string;
  profileBasePath: string;
}

export const LOCAL_SEO_CITIES: SeoCityEntry[] = [
  // Spain – Barcelona
  { citySlug: "barcelona", basePath: "/es/escorts-barcelona", profileBasePath: "/es/escorts-barcelona/modelo" },
  // Spain – Madrid
  { citySlug: "madrid", basePath: "/es/escorts-madrid", profileBasePath: "/es/escorts-madrid/modelo" },
  // Brazil – Florianópolis
  { citySlug: "florianopolis", basePath: "/br/acompanhantes-florianopolis", profileBasePath: "/br/acompanhantes-florianopolis/modelo" },
  // Brazil – São Paulo
  { citySlug: "sao-paulo", basePath: "/br/acompanhantes-sao-paulo", profileBasePath: "/br/acompanhantes-sao-paulo/modelo" },
];

/**
 * Pre-built map from citySlug -> profileBasePath for O(1) lookups.
 */
export const CITY_SLUG_TO_PROFILE_BASE: Map<string, string> = new Map(
  LOCAL_SEO_CITIES.map((c) => [c.citySlug, c.profileBasePath])
);
