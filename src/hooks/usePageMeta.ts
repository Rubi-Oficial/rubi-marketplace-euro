import { useEffect } from "react";
import { buildCanonicalUrl, getSiteIdentity } from "@/config/site";

const SITE = getSiteIdentity();
const SITE_NAME = SITE.siteName;
const SITE_URL = SITE.siteUrl;
const DEFAULT_IMAGE = SITE.defaultOgImage;

interface PageMetaOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: { name: string; url: string }[];
  hreflang?: { lang: string; url: string }[];
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeJsonLd() {
  document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  removeJsonLd();
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function setRobots(noindex: boolean) {
  let el = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (noindex) {
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "robots");
      document.head.appendChild(el);
    }
    el.setAttribute("content", "noindex, follow");
  } else if (el && el.getAttribute("content")?.includes("noindex")) {
    el.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  }
}

function buildBreadcrumbJsonLd(breadcrumbs: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}

function setHreflangLinks(links: { lang: string; url: string }[]) {
  document.querySelectorAll('link[data-seo-hreflang]').forEach((el) => el.remove());
  links.forEach(({ lang, url }) => {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", lang);
    link.setAttribute("href", url);
    link.setAttribute("data-seo-hreflang", "true");
    document.head.appendChild(link);
  });
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${options.title} | ${SITE_NAME}`;
    const url = buildCanonicalUrl(options.path || "/");
    const image = options.image || DEFAULT_IMAGE;
    const imageAlt = options.imageAlt || options.title;

    document.title = fullTitle;
    setMeta("description", options.description);

    setMeta("og:title", fullTitle, true);
    setMeta("og:description", options.description, true);
    setMeta("og:url", url, true);
    setMeta("og:image", image, true);
    setMeta("og:image:alt", imageAlt, true);
    setMeta("og:type", options.type || "website", true);
    setMeta("og:site_name", SITE_NAME, true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", options.description);
    setMeta("twitter:image", image);
    setMeta("twitter:image:alt", imageAlt);

    setCanonical(url);
    setRobots(!!options.noindex);

    if (options.hreflang && options.hreflang.length > 0) setHreflangLinks(options.hreflang);

    const jsonLdItems: Record<string, unknown>[] = [];
    if (options.jsonLd) jsonLdItems.push(...(Array.isArray(options.jsonLd) ? options.jsonLd : [options.jsonLd]));
    if (options.breadcrumbs?.length) jsonLdItems.push(buildBreadcrumbJsonLd(options.breadcrumbs));
    if (jsonLdItems.length > 0) setJsonLd(jsonLdItems);

    return () => {
      document.title = `${SITE.defaultTitle} | ${SITE_NAME}`;
      removeJsonLd();
      setRobots(false);
      document.querySelectorAll('link[data-seo-hreflang]').forEach((el) => el.remove());
    };
  }, [options.title, options.description, options.path, options.image, options.imageAlt, options.type, options.noindex, options.jsonLd, options.breadcrumbs, options.hreflang]);
}

export { SITE_NAME, SITE_URL, DEFAULT_IMAGE };
