export type SeoMarket = "es";
export type SeoPageType = "city" | "district" | "attribute";

export interface SeoLocalPageConfig {
  slug: string;
  type: SeoPageType;
  title: string;
  h1: string;
  description: string;
  intro: string;
  faq: { question: string; answer: string }[];
  serviceSlug?: string;
  category?: string;
  districtKeyword?: string;
  indexMinProfiles?: number;
}

export interface SeoCityConfig {
  citySlug: string;
  cityName: string;
  basePath: string;
  market: SeoMarket;
  label: string;
  profileBasePath: string;
  pages: SeoLocalPageConfig[];
}

export const LOCAL_SEO_SITE_URL = "https://rubigirls.fun";
export const INDEX_MIN_PROFILES = 8;

export const MARKET_LABEL: Record<SeoMarket, string> = {
  es: "Europa",
};

const defaultFaqEs = (city: string) => [
  { question: `¿Cómo encontrar perfiles en ${city}?`, answer: `Usa filtros por servicio y explora perfiles verificados con contacto directo en ${city}.` },
  { question: "¿Los perfiles están activos?", answer: "Mostramos perfiles elegibles y activos para mantener resultados actualizados." },
];

const cityPages = (city: string): SeoLocalPageConfig[] => [
  {
    slug: "",
    type: "city",
    title: `Servicios premium en ${city} | Perfiles verificados y contacto directo`,
    h1: `Servicios premium en ${city}`,
    description: `Descubre perfiles verificados en ${city} con contacto directo. Filtra por Massagem, VIP, Jantar y Viagem.`,
    intro: `Explora ${city} con navegación optimizada entre ciudad, servicio y perfil detallado.`,
    faq: defaultFaqEs(city),
  },
  {
    slug: "massagem",
    type: "attribute",
    title: `Massagem en ${city} | Perfiles verificados`,
    h1: `Massagem en ${city}`,
    description: `Encuentra perfiles de Massagem en ${city} con fotos reales y contacto directo.`,
    intro: `Landing SEO de Massagem + ${city} preparada para intención local.`,
    faq: defaultFaqEs(city),
    serviceSlug: "massage",
    indexMinProfiles: 8,
  },
  {
    slug: "vip",
    type: "attribute",
    title: `VIP en ${city} | Perfiles premium`,
    h1: `VIP en ${city}`,
    description: `Perfiles VIP en ${city} con navegación interna por ciudad, categoría y detalle.`,
    intro: `Página VIP de ${city} con foco en demanda premium y contacto directo.`,
    faq: defaultFaqEs(city),
    serviceSlug: "vip",
    indexMinProfiles: 8,
  },
  {
    slug: "jantar",
    type: "attribute",
    title: `Jantar en ${city} | Perfiles verificados`,
    h1: `Jantar en ${city}`,
    description: `Explora perfiles para Jantar en ${city} con filtros rápidos por servicio y ciudad.`,
    intro: `Combinación SEO de Jantar + ${city} para búsquedas contextuales.`,
    faq: defaultFaqEs(city),
    serviceSlug: "dinner-date",
    indexMinProfiles: 8,
  },
  {
    slug: "viagem",
    type: "attribute",
    title: `Viagem en ${city} | Perfiles con disponibilidad`,
    h1: `Viagem en ${city}`,
    description: `Perfiles orientados a Viagem en ${city}, con contacto directo y señalización premium.`,
    intro: `Página SEO de Viagem + ${city} con enlaces internos relacionados.`,
    faq: defaultFaqEs(city),
    serviceSlug: "travel-companion",
    indexMinProfiles: 8,
  },
  {
    slug: "independientes",
    type: "attribute",
    title: `Perfiles independientes en ${city} | Selección verificada`,
    h1: `Perfiles independientes en ${city}`,
    description: `Descubre perfiles independientes en ${city} con navegación por servicios destacados.`,
    intro: `Combinación categoría + ciudad en ${city} para fortalecer indexación temática.`,
    faq: defaultFaqEs(city),
    category: "independientes",
    indexMinProfiles: 8,
  },
];

export const LOCAL_SEO_CITIES: SeoCityConfig[] = [
  { market: "es", citySlug: "barcelona", cityName: "Barcelona", label: "Servicios premium Barcelona", basePath: "/es/escorts-barcelona", profileBasePath: "/es/escorts-barcelona/modelo", pages: cityPages("Barcelona") },
  { market: "es", citySlug: "madrid", cityName: "Madrid", label: "Servicios premium Madrid", basePath: "/es/escorts-madrid", profileBasePath: "/es/escorts-madrid/modelo", pages: cityPages("Madrid") },
  { market: "es", citySlug: "paris", cityName: "Paris", label: "Servicios premium Paris", basePath: "/es/escorts-paris", profileBasePath: "/es/escorts-paris/modelo", pages: cityPages("Paris") },
  { market: "es", citySlug: "lisbon", cityName: "Lisbon", label: "Servicios premium Lisbon", basePath: "/es/escorts-lisbon", profileBasePath: "/es/escorts-lisbon/modelo", pages: cityPages("Lisbon") },
  { market: "es", citySlug: "milan", cityName: "Milan", label: "Servicios premium Milan", basePath: "/es/escorts-milan", profileBasePath: "/es/escorts-milan/modelo", pages: cityPages("Milan") },
  { market: "es", citySlug: "marbella", cityName: "Marbella", label: "Servicios premium Marbella", basePath: "/es/escorts-marbella", profileBasePath: "/es/escorts-marbella/modelo", pages: cityPages("Marbella") },
];

export const MARKET_HUBS: Record<SeoMarket, { title: string; description: string; h1: string; intro: string }> = {
  es: {
    title: "Servicios premium en Europa | Barcelona, Madrid, Paris, Lisbon, Milan y Marbella",
    h1: "Servicios premium en Europa",
    description: "Explora hubs locales en Europa con páginas indexables por ciudad, categoría y servicio.",
    intro: "Elige una ciudad para navegar entre listados, páginas de servicio y perfiles detallados con breadcrumbs consistentes.",
  },
};

export function getSeoCityConfig(market: string | undefined, cityBaseSlug: string | undefined) {
  return LOCAL_SEO_CITIES.find((c) => c.market === market && c.basePath.split("/")[2] === cityBaseSlug);
}

export function getSeoPageConfig(market: string | undefined, cityBaseSlug: string | undefined, pageSlug?: string) {
  const city = getSeoCityConfig(market, cityBaseSlug);
  if (!city) return null;
  return { city, page: city.pages.find((p) => p.slug === (pageSlug || "")) || null };
}

export function getCanonicalSeoProfilePath(citySlug: string | null | undefined, profileSlug: string) {
  const city = LOCAL_SEO_CITIES.find((entry) => entry.citySlug === citySlug);
  return city ? `${city.profileBasePath}/${profileSlug}` : `/perfil/${profileSlug}`;
}
