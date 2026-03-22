import { useEffect } from "react";

const SITE_NAME = "Rubi Girls";
const SITE_URL = "https://rubi-marketplace-euro.lovable.app";
const DEFAULT_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3fb95501-7293-435c-8e48-18647dd9730a/id-preview-c1672483--253fcd53-5b7c-44c1-a163-aa96b1bf2105.lovable.app-1773883136683.png";

interface PageMetaOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
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

function setJsonLd(data: Record<string, unknown>) {
  removeJsonLd();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo-jsonld", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
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
    el.setAttribute("content", "noindex, nofollow");
  } else if (el) {
    el.remove();
  }
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${options.title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${options.path || ""}`;
    const image = options.image || DEFAULT_IMAGE;

    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta("description", options.description);

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", options.description, true);
    setMeta("og:url", url, true);
    setMeta("og:image", image, true);
    setMeta("og:type", options.type || "website", true);
    setMeta("og:site_name", SITE_NAME, true);

    // Twitter
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", options.description);
    setMeta("twitter:image", image);

    // Canonical
    setCanonical(url);

    // Robots
    setRobots(!!options.noindex);

    // JSON-LD
    if (options.jsonLd) {
      setJsonLd(options.jsonLd);
    }

    return () => {
      document.title = `${SITE_NAME} — Premium European Catalogue`;
      removeJsonLd();
      setRobots(false);
    };
  }, [options.title, options.description, options.path, options.image, options.type, options.noindex, options.jsonLd]);
}

export { SITE_NAME, SITE_URL };
