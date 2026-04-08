import { LOCAL_SEO_CITIES } from "@/config/localSeoPages";

export function getCanonicalCityPath(citySlug: string | null | undefined) {
  if (!citySlug) return "/buscar";
  const localCity = LOCAL_SEO_CITIES.find((item) => item.citySlug === citySlug);
  return localCity ? localCity.basePath : `/cidade/${citySlug}`;
}

export function getCanonicalProfilePath(citySlug: string | null | undefined, profileSlug: string) {
  const localCity = citySlug ? LOCAL_SEO_CITIES.find((item) => item.citySlug === citySlug) : null;
  return localCity ? `${localCity.profileBasePath}/${profileSlug}` : `/perfil/${profileSlug}`;
}

export function shouldNoindexLegacyCity(citySlug: string | null | undefined) {
  if (!citySlug) return false;
  return LOCAL_SEO_CITIES.some((item) => item.citySlug === citySlug);
}

export function shouldNoindexLegacyProfile(citySlug: string | null | undefined) {
  if (!citySlug) return false;
  return LOCAL_SEO_CITIES.some((item) => item.citySlug === citySlug);
}

export function getProfilePublicPath(profile: { city_slug: string | null; slug: string | null }) {
  if (!profile.slug) return "/buscar";
  return getCanonicalProfilePath(profile.city_slug, profile.slug);
}
