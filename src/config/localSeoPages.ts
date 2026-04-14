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

const seoCity = (slug: string, name: string): SeoCityConfig => ({
  market: "es",
  citySlug: slug,
  cityName: name,
  label: `Servicios premium ${name}`,
  basePath: `/es/escorts-${slug}`,
  profileBasePath: `/es/escorts-${slug}/modelo`,
  pages: cityPages(name),
});

export const LOCAL_SEO_CITIES: SeoCityConfig[] = [
  // Spain
  seoCity("barcelona", "Barcelona"),
  seoCity("madrid", "Madrid"),
  seoCity("valencia", "Valencia"),
  seoCity("seville", "Seville"),
  seoCity("malaga", "Malaga"),
  seoCity("bilbao", "Bilbao"),
  seoCity("ibiza", "Ibiza"),
  seoCity("marbella", "Marbella"),
  seoCity("palma-de-mallorca", "Palma de Mallorca"),
  // Portugal
  seoCity("lisbon", "Lisbon"),
  seoCity("porto", "Porto"),
  seoCity("faro", "Faro"),
  seoCity("braga", "Braga"),
  seoCity("coimbra", "Coimbra"),
  seoCity("funchal", "Funchal"),
  seoCity("albufeira", "Albufeira"),
  // France
  seoCity("paris", "Paris"),
  seoCity("lyon", "Lyon"),
  seoCity("marseille", "Marseille"),
  seoCity("nice", "Nice"),
  seoCity("toulouse", "Toulouse"),
  seoCity("bordeaux", "Bordeaux"),
  seoCity("strasbourg", "Strasbourg"),
  seoCity("cannes", "Cannes"),
  seoCity("monaco", "Monaco"),
  // Italy
  seoCity("milan", "Milan"),
  seoCity("rome", "Rome"),
  seoCity("florence", "Florence"),
  seoCity("naples", "Naples"),
  seoCity("venice", "Venice"),
  seoCity("turin", "Turin"),
  seoCity("bologna", "Bologna"),
  seoCity("verona", "Verona"),
  // Germany
  seoCity("berlin", "Berlin"),
  seoCity("munich", "Munich"),
  seoCity("frankfurt", "Frankfurt"),
  seoCity("hamburg", "Hamburg"),
  seoCity("cologne", "Cologne"),
  seoCity("dusseldorf", "Düsseldorf"),
  seoCity("stuttgart", "Stuttgart"),
  seoCity("hanover", "Hanover"),
  // Netherlands
  seoCity("amsterdam", "Amsterdam"),
  seoCity("rotterdam", "Rotterdam"),
  seoCity("den-haag", "Den Haag"),
  seoCity("utrecht", "Utrecht"),
  seoCity("eindhoven", "Eindhoven"),
  seoCity("groningen", "Groningen"),
  seoCity("maastricht", "Maastricht"),
  // Belgium
  seoCity("brussels", "Brussels"),
  seoCity("antwerp", "Antwerp"),
  seoCity("ghent", "Ghent"),
  seoCity("bruges", "Bruges"),
  seoCity("liege", "Liège"),
  seoCity("leuven", "Leuven"),
  seoCity("namur", "Namur"),
  // United Kingdom
  seoCity("london", "London"),
  seoCity("manchester", "Manchester"),
  seoCity("birmingham", "Birmingham"),
  seoCity("edinburgh", "Edinburgh"),
  seoCity("liverpool", "Liverpool"),
  seoCity("glasgow", "Glasgow"),
  seoCity("bristol", "Bristol"),
  seoCity("leeds", "Leeds"),
  // Switzerland
  seoCity("zurich", "Zurich"),
  seoCity("geneva", "Geneva"),
  seoCity("basel", "Basel"),
  seoCity("bern", "Bern"),
  seoCity("lausanne", "Lausanne"),
  // Austria
  seoCity("vienna", "Vienna"),
  seoCity("salzburg", "Salzburg"),
  seoCity("innsbruck", "Innsbruck"),
  seoCity("graz", "Graz"),
  seoCity("linz", "Linz"),
  // Ireland
  seoCity("dublin", "Dublin"),
  seoCity("cork", "Cork"),
  seoCity("galway", "Galway"),
  seoCity("limerick", "Limerick"),
  // Sweden
  seoCity("stockholm", "Stockholm"),
  seoCity("gothenburg", "Gothenburg"),
  seoCity("malmo", "Malmö"),
  seoCity("uppsala", "Uppsala"),
  // Denmark
  seoCity("copenhagen", "Copenhagen"),
  seoCity("aarhus", "Aarhus"),
  seoCity("odense", "Odense"),
  // Norway
  seoCity("oslo", "Oslo"),
  seoCity("bergen", "Bergen"),
  seoCity("stavanger", "Stavanger"),
  seoCity("trondheim", "Trondheim"),
  // Poland
  seoCity("warsaw", "Warsaw"),
  seoCity("krakow", "Krakow"),
  seoCity("wroclaw", "Wroclaw"),
  seoCity("gdansk", "Gdansk"),
  seoCity("poznan", "Poznan"),
  // Czech Republic
  seoCity("prague", "Prague"),
  seoCity("brno", "Brno"),
  seoCity("ostrava", "Ostrava"),
  // Greece
  seoCity("athens", "Athens"),
  seoCity("thessaloniki", "Thessaloniki"),
  seoCity("mykonos", "Mykonos"),
  seoCity("santorini", "Santorini"),
  // Luxembourg
  seoCity("luxembourg-city", "Luxembourg City"),
  seoCity("esch-sur-alzette", "Esch-sur-Alzette"),
];

const allCityNames = LOCAL_SEO_CITIES.map((c) => c.cityName);
const hubCities = allCityNames.length > 6
  ? allCityNames.slice(0, 5).join(", ") + " y más"
  : allCityNames.join(", ");

export const MARKET_HUBS: Record<SeoMarket, { title: string; description: string; h1: string; intro: string }> = {
  es: {
    title: `Servicios premium en Europa | ${hubCities}`,
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
