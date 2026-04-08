export type SeoMarket = "es" | "br";
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
  es: "Espanha",
  br: "Brasil",
};

const defaultFaqEs = (city: string) => [
  { question: `¿Cómo encontrar perfiles en ${city}?`, answer: `Usa los filtros por servicio y explora perfiles verificados con contacto directo en ${city}.` },
  { question: "¿Los perfiles están activos?", answer: "Mostramos perfiles elegibles y activos para mantener resultados actualizados." },
];

const defaultFaqBr = (city: string) => [
  { question: `Como encontrar perfis em ${city}?`, answer: `Explore os filtros de serviço e veja perfis verificados com contato direto em ${city}.` },
  { question: "Os perfis são atualizados?", answer: "A listagem utiliza perfis elegíveis e ativos para manter a qualidade da navegação." },
];

export const LOCAL_SEO_CITIES: SeoCityConfig[] = [
  {
    market: "es", citySlug: "barcelona", cityName: "Barcelona", label: "Escorts Barcelona", basePath: "/es/escorts-barcelona", profileBasePath: "/es/escorts-barcelona/modelo",
    pages: [
      { slug: "", type: "city", title: "Escorts en Barcelona | Perfiles verificados y contacto directo", h1: "Escorts en Barcelona", description: "Descubre escorts en Barcelona con perfiles verificados, fotos y contacto directo. Explora perfiles por zona, estilo y servicio.", intro: "Encuentra escorts en Barcelona con una navegación pensada para descubrir perfiles por zona y estilo.", faq: defaultFaqEs("Barcelona") },
      { slug: "eixample", type: "district", title: "Escorts en Eixample, Barcelona | Perfiles verificados", h1: "Escorts en Eixample, Barcelona", description: "Perfiles de escorts en Eixample, Barcelona, con contacto directo y fichas verificadas.", intro: "Landing local preparada para Eixample. Activamos filtros avanzados por zona al detectar datos consistentes.", faq: defaultFaqEs("Eixample"), districtKeyword: "eixample", indexMinProfiles: 8 },
      { slug: "gotic", type: "district", title: "Escorts en Gòtic, Barcelona | Contacto directo", h1: "Escorts en Gòtic, Barcelona", description: "Descubre perfiles de escorts en el Gòtic de Barcelona con fotos y contacto directo.", intro: "Página local para el barrio Gòtic con estructura SEO lista para crecer por inventario.", faq: defaultFaqEs("Gòtic"), districtKeyword: "gotic", indexMinProfiles: 8 },
      { slug: "gracia", type: "district", title: "Escorts en Gràcia, Barcelona | Perfiles seleccionados", h1: "Escorts en Gràcia, Barcelona", description: "Explora escorts en Gràcia con perfiles seleccionados y contacto directo.", intro: "Landing de Gràcia preparada para consolidar resultados por zona conforme crece el inventario.", faq: defaultFaqEs("Gràcia"), districtKeyword: "gracia", indexMinProfiles: 8 },
      { slug: "vip", type: "attribute", title: "VIP Escorts en Barcelona | Perfiles seleccionados", h1: "VIP Escorts en Barcelona", description: "Perfiles VIP en Barcelona con fotos verificadas y contacto directo.", intro: "Selección VIP para Barcelona usando los filtros actuales del catálogo.", faq: defaultFaqEs("Barcelona"), serviceSlug: "vip", indexMinProfiles: 8 },
      { slug: "luxury", type: "attribute", title: "Luxury Escorts en Barcelona | Perfiles premium", h1: "Luxury Escorts en Barcelona", description: "Explora perfiles luxury en Barcelona con enfoque premium y contacto directo.", intro: "Landing premium de Barcelona optimizada para intención de búsqueda luxury.", faq: defaultFaqEs("Barcelona"), serviceSlug: "luxury", indexMinProfiles: 8 },
      { slug: "independientes", type: "attribute", title: "Escorts independientes en Barcelona | Contacto directo", h1: "Escorts independientes en Barcelona", description: "Perfiles independientes en Barcelona con contacto directo y navegación por servicio.", intro: "Página temática para escorts independientes de Barcelona.", faq: defaultFaqEs("Barcelona"), category: "independientes", indexMinProfiles: 8 },
    ],
  },
  {
    market: "es", citySlug: "madrid", cityName: "Madrid", label: "Escorts Madrid", basePath: "/es/escorts-madrid", profileBasePath: "/es/escorts-madrid/modelo",
    pages: [
      { slug: "", type: "city", title: "Escorts en Madrid | Perfiles verificados y contacto directo", h1: "Escorts en Madrid", description: "Encuentra escorts en Madrid con perfiles verificados, fotos y contacto directo. Explora perfiles por zona, estilo y servicio.", intro: "Explora escorts en Madrid con foco local para descubrir perfiles por zona y estilo.", faq: defaultFaqEs("Madrid") },
      { slug: "salamanca", type: "district", title: "Escorts en Salamanca, Madrid | Perfiles verificados", h1: "Escorts en Salamanca, Madrid", description: "Perfiles en Salamanca, Madrid, con fotos y contacto directo.", intro: "Landing local para Salamanca, preparada para crecer con dados por zona.", faq: defaultFaqEs("Salamanca"), districtKeyword: "salamanca", indexMinProfiles: 8 },
      { slug: "chamberi", type: "district", title: "Escorts en Chamberí, Madrid | Contacto directo", h1: "Escorts en Chamberí, Madrid", description: "Descubre escorts en Chamberí, Madrid, con contacto directo.", intro: "Página local de Chamberí com arquitetura SEO pronta para escala.", faq: defaultFaqEs("Chamberí"), districtKeyword: "chamberi", indexMinProfiles: 8 },
      { slug: "chamartin", type: "district", title: "Escorts en Chamartín, Madrid | Perfiles premium", h1: "Escorts en Chamartín, Madrid", description: "Perfiles premium en Chamartín, Madrid, con acceso rápido a contacto.", intro: "Landing de Chamartín preparada para indexación progressiva por inventario.", faq: defaultFaqEs("Chamartín"), districtKeyword: "chamartin", indexMinProfiles: 8 },
      { slug: "vip", type: "attribute", title: "VIP Escorts en Madrid | Perfiles verificados", h1: "VIP Escorts en Madrid", description: "Selección VIP en Madrid con perfiles verificados.", intro: "Landing VIP de Madrid usando filtros de servicio já existentes.", faq: defaultFaqEs("Madrid"), serviceSlug: "vip", indexMinProfiles: 8 },
      { slug: "luxury", type: "attribute", title: "Luxury Escorts en Madrid | Perfiles premium", h1: "Luxury Escorts en Madrid", description: "Perfiles luxury en Madrid con propuesta premium y contacto directo.", intro: "Página luxury de Madrid orientada a busca de alta intenção.", faq: defaultFaqEs("Madrid"), serviceSlug: "luxury", indexMinProfiles: 8 },
      { slug: "elite", type: "attribute", title: "Elite Escorts en Madrid | Perfiles seleccionados", h1: "Elite Escorts en Madrid", description: "Perfiles elite en Madrid con foco en calidad y contacto directo.", intro: "Landing elite de Madrid preparada para crecimiento orgánico.", faq: defaultFaqEs("Madrid"), serviceSlug: "elite", indexMinProfiles: 8 },
    ],
  },
  {
    market: "br", citySlug: "florianopolis", cityName: "Florianópolis", label: "Acompanhantes Florianópolis", basePath: "/br/acompanhantes-florianopolis", profileBasePath: "/br/acompanhantes-florianopolis/modelo",
    pages: [
      { slug: "", type: "city", title: "Acompanhantes em Florianópolis | Perfis verificados", h1: "Acompanhantes em Florianópolis", description: "Encontre acompanhantes em Florianópolis com perfis verificados, fotos e contato direto. Explore por bairro, estilo e atendimento.", intro: "Navegue por acompanhantes em Florianópolis com páginas locais e filtros por intenção.", faq: defaultFaqBr("Florianópolis") },
      { slug: "jurere-internacional", type: "district", title: "Acompanhantes em Jurerê Internacional | Perfis verificados", h1: "Acompanhantes em Jurerê Internacional", description: "Perfis de acompanhantes em Jurerê Internacional com contato direto.", intro: "Landing local pronta para Jurerê Internacional com estrutura escalável para dados por bairro.", faq: defaultFaqBr("Jurerê Internacional"), districtKeyword: "jurere", indexMinProfiles: 8 },
      { slug: "trindade", type: "district", title: "Acompanhantes na Trindade, Florianópolis | Contato direto", h1: "Acompanhantes na Trindade, Florianópolis", description: "Explore perfis de acompanhantes na Trindade com fotos e contato direto.", intro: "Página de Trindade preparada para indexação quando houver massa de conteúdo local.", faq: defaultFaqBr("Trindade"), districtKeyword: "trindade", indexMinProfiles: 8 },
      { slug: "centro", type: "district", title: "Acompanhantes no Centro de Florianópolis | Perfis selecionados", h1: "Acompanhantes no Centro de Florianópolis", description: "Perfis selecionados de acompanhantes no Centro de Florianópolis.", intro: "Landing do Centro de Florianópolis preparada para crescimento orgânico local.", faq: defaultFaqBr("Centro de Florianópolis"), districtKeyword: "centro", indexMinProfiles: 8 },
      { slug: "loiras", type: "attribute", title: "Acompanhantes loiras em Florianópolis | Perfis verificados", h1: "Acompanhantes loiras em Florianópolis", description: "Perfis de acompanhantes loiras em Florianópolis com contato direto.", intro: "Página por atributo loiras em Florianópolis usando filtros existentes.", faq: defaultFaqBr("Florianópolis"), category: "loiras", indexMinProfiles: 8 },
      { slug: "morenas", type: "attribute", title: "Acompanhantes morenas em Florianópolis | Perfis verificados", h1: "Acompanhantes morenas em Florianópolis", description: "Encontre acompanhantes morenas em Florianópolis com perfis selecionados.", intro: "Página por atributo morenas em Florianópolis para intenção específica.", faq: defaultFaqBr("Florianópolis"), category: "morenas", indexMinProfiles: 8 },
      { slug: "com-local", type: "attribute", title: "Acompanhantes com local em Florianópolis | Contato direto", h1: "Acompanhantes com local em Florianópolis", description: "Perfis com local em Florianópolis, com navegação otimizada para conversão.", intro: "Landing com local para Florianópolis usando filtros de serviço.", faq: defaultFaqBr("Florianópolis"), serviceSlug: "com-local", indexMinProfiles: 8 },
      { slug: "a-domicilio", type: "attribute", title: "Acompanhantes a domicílio em Florianópolis | Contato direto", h1: "Acompanhantes a domicílio em Florianópolis", description: "Explore acompanhantes a domicílio em Florianópolis com contato direto.", intro: "Página para atendimento a domicílio em Florianópolis.", faq: defaultFaqBr("Florianópolis"), serviceSlug: "a-domicilio", indexMinProfiles: 8 },
    ],
  },
  {
    market: "br", citySlug: "sao-paulo", cityName: "São Paulo", label: "Acompanhantes São Paulo", basePath: "/br/acompanhantes-sao-paulo", profileBasePath: "/br/acompanhantes-sao-paulo/modelo",
    pages: [
      { slug: "", type: "city", title: "Acompanhantes em São Paulo | Perfis verificados", h1: "Acompanhantes em São Paulo", description: "Explore acompanhantes em São Paulo com perfis verificados, fotos e contato direto. Veja perfis por bairro, estilo e atendimento.", intro: "Descubra acompanhantes em São Paulo com hubs locais por bairro e atributo.", faq: defaultFaqBr("São Paulo") },
      { slug: "jardins", type: "district", title: "Acompanhantes no Jardins | Perfis verificados", h1: "Acompanhantes no Jardins", description: "Perfis de acompanhantes no Jardins com contato direto.", intro: "Landing local de Jardins pronta para ampliação de conteúdo e links internos.", faq: defaultFaqBr("Jardins"), districtKeyword: "jardins", indexMinProfiles: 8 },
      { slug: "moema", type: "district", title: "Acompanhantes em Moema | Contato direto", h1: "Acompanhantes em Moema", description: "Explore acompanhantes em Moema com perfis selecionados e contato direto.", intro: "Página local de Moema preparada para SEO local escalável.", faq: defaultFaqBr("Moema"), districtKeyword: "moema", indexMinProfiles: 8 },
      { slug: "vila-olimpia", type: "district", title: "Acompanhantes na Vila Olímpia | Perfis selecionados", h1: "Acompanhantes na Vila Olímpia", description: "Perfis selecionados de acompanhantes na Vila Olímpia.", intro: "Landing da Vila Olímpia com base pronta para dados de bairro estruturados.", faq: defaultFaqBr("Vila Olímpia"), districtKeyword: "vila olimpia", indexMinProfiles: 8 },
      { slug: "loiras", type: "attribute", title: "Acompanhantes loiras em São Paulo | Perfis verificados", h1: "Acompanhantes loiras em São Paulo", description: "Perfis de acompanhantes loiras em São Paulo com contato direto.", intro: "Página por atributo loiras em São Paulo.", faq: defaultFaqBr("São Paulo"), category: "loiras", indexMinProfiles: 8 },
      { slug: "morenas", type: "attribute", title: "Acompanhantes morenas em São Paulo | Perfis verificados", h1: "Acompanhantes morenas em São Paulo", description: "Explore acompanhantes morenas em São Paulo com perfis selecionados.", intro: "Landing por atributo morenas em São Paulo.", faq: defaultFaqBr("São Paulo"), category: "morenas", indexMinProfiles: 8 },
      { slug: "com-local", type: "attribute", title: "Acompanhantes com local em São Paulo | Contato direto", h1: "Acompanhantes com local em São Paulo", description: "Perfis com local em São Paulo para contato rápido.", intro: "Página com local em São Paulo com filtros reaproveitados.", faq: defaultFaqBr("São Paulo"), serviceSlug: "com-local", indexMinProfiles: 8 },
      { slug: "a-domicilio", type: "attribute", title: "Acompanhantes a domicílio em São Paulo | Contato direto", h1: "Acompanhantes a domicílio em São Paulo", description: "Acompanhantes a domicílio em São Paulo com contato direto.", intro: "Landing de atendimento a domicílio para São Paulo.", faq: defaultFaqBr("São Paulo"), serviceSlug: "a-domicilio", indexMinProfiles: 8 },
    ],
  },
];

export const MARKET_HUBS: Record<SeoMarket, { title: string; description: string; h1: string; intro: string }> = {
  es: { title: "Escorts en España | Barcelona y Madrid", h1: "Escorts en España", description: "Explora escorts en España con hubs locales para Barcelona y Madrid.", intro: "Selecciona una ciudad para descubrir perfiles locales verificados." },
  br: { title: "Acompanhantes no Brasil | Florianópolis e São Paulo", h1: "Acompanhantes no Brasil", description: "Navegue por acompanhantes no Brasil com hubs locais em Florianópolis e São Paulo.", intro: "Escolha uma cidade para explorar perfis verificados e páginas locais por intenção." },
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
