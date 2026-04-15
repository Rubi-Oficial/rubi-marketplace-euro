import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CATEGORY_SLUGS = ["women", "men", "couples", "shemales", "gay", "virtual-sex", "videos"];
const SITE_URL = "https://velvetescorts.vip";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/buscar", priority: "0.9", changefreq: "daily" },
  { path: "/planos", priority: "0.8", changefreq: "weekly" },
  { path: "/sobre", priority: "0.5", changefreq: "monthly" },
  { path: "/contato", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.6", changefreq: "weekly" },
  { path: "/termos", priority: "0.3", changefreq: "monthly" },
  { path: "/privacidade", priority: "0.3", changefreq: "monthly" },
  { path: "/cookies", priority: "0.3", changefreq: "monthly" },
  { path: "/es", priority: "0.8", changefreq: "weekly" },
];

// All European SEO city slugs matching LOCAL_SEO_CITIES in src/config/localSeoPages.ts
const SEO_CITY_SLUGS = [
  "barcelona", "madrid", "valencia", "seville", "malaga", "bilbao", "ibiza", "marbella", "palma-de-mallorca",
  "lisbon", "porto", "faro", "braga", "coimbra", "funchal", "albufeira",
  "paris", "lyon", "marseille", "nice", "toulouse", "bordeaux", "strasbourg", "cannes", "monaco",
  "milan", "rome", "florence", "naples", "venice", "turin", "bologna", "verona",
  "berlin", "munich", "frankfurt", "hamburg", "cologne", "dusseldorf", "stuttgart", "hanover",
  "amsterdam", "rotterdam", "den-haag", "utrecht", "eindhoven", "groningen", "maastricht",
  "brussels", "antwerp", "ghent", "bruges", "liege", "leuven", "namur",
  "london", "manchester", "birmingham", "edinburgh", "liverpool", "glasgow", "bristol", "leeds",
  "zurich", "geneva", "basel", "bern", "lausanne",
  "vienna", "salzburg", "innsbruck", "graz", "linz",
  "dublin", "cork", "galway", "limerick",
  "stockholm", "gothenburg", "malmo", "uppsala",
  "copenhagen", "aarhus", "odense",
  "oslo", "bergen", "stavanger", "trondheim",
  "warsaw", "krakow", "wroclaw", "gdansk", "poznan",
  "prague", "brno", "ostrava",
  "athens", "thessaloniki", "mykonos", "santorini",
  "luxembourg-city", "esch-sur-alzette",
];

const SEO_SUB_PAGE_SLUGS = ["massagem", "vip", "jantar", "viagem", "independientes"];

const toUrlNode = (path: string, lastmod: string, changefreq = "weekly", priority = "0.7") =>
  `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cities } = await supabase.from("cities").select("slug, is_featured").eq("is_active", true);
    const { data: profiles } = await supabase.from("eligible_profiles").select("slug, city_slug, updated_at");

    const today = new Date().toISOString().split("T")[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of STATIC_PAGES) xml += toUrlNode(page.path, today, page.changefreq, page.priority);

    // Category pages
    for (const cat of CATEGORY_SLUGS) xml += toUrlNode(`/categoria/${cat}`, today, "daily", "0.8");

    // DB-driven city pages
    if (cities) {
      for (const city of cities) {
        xml += toUrlNode(`/cidade/${city.slug}`, today, "daily", city.is_featured ? "0.9" : "0.7");
      }
    }

    // Local SEO city pages (/es/escorts-{slug})
    for (const slug of SEO_CITY_SLUGS) {
      xml += toUrlNode(`/es/escorts-${slug}`, today, "daily", "0.9");
      // Sub-pages (services/attributes)
      for (const sub of SEO_SUB_PAGE_SLUGS) {
        xml += toUrlNode(`/es/escorts-${slug}/${sub}`, today, "weekly", "0.75");
      }
    }

    // Market hub
    xml += toUrlNode("/es", today, "weekly", "0.8");

    // Profile pages
    if (profiles) {
      for (const p of profiles) {
        if (!p.slug) continue;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
        xml += toUrlNode(`/perfil/${p.slug}`, lastmod, "weekly", "0.6");
        // City-scoped profile URL
        if (p.city_slug) {
          xml += toUrlNode(`/es/escorts-${p.city_slug}/modelo/${p.slug}`, lastmod, "weekly", "0.7");
        }
      }
    }

    xml += `</urlset>`;
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
