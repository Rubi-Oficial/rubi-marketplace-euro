import { sharedSiteDefaults } from "@/config/site.shared";

/**
 * Central place for brand/domain migration.
 * Update shared defaults and/or VITE_SITE_URL to switch identity and canonical domain.
 */
export const siteConfig = {
  ...sharedSiteDefaults,
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined) || sharedSiteDefaults.siteUrl,
  isProduction: import.meta.env.PROD,
} as const;

const ensureLeadingSlash = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export function buildAbsoluteUrl(path = "/") {
  return new URL(ensureLeadingSlash(path), siteConfig.siteUrl).toString();
}

export function buildCanonicalUrl(path = "/") {
  return buildAbsoluteUrl(path);
}

export function getSiteIdentity() {
  return siteConfig;
}

export function buildHreflangUrls(path = "/") {
  return siteConfig.supportedLocales.map((locale) => ({ lang: locale, url: buildAbsoluteUrl(path) }));
}
