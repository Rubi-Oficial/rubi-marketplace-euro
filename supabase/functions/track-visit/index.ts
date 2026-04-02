import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /telegrambot/i, /discordbot/i,
  /curl/i, /wget/i, /python-requests/i, /httpie/i,
  /go-http-client/i, /java\//i, /axios/i, /node-fetch/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i,
  /scrapy/i, /httpclient/i, /libwww/i,
];

const TRUSTED_IP_HEADERS = [
  "x-real-ip",
  "x-forwarded-for",
  "cf-connecting-ip",
  "x-client-ip",
  "x-forwarded",
  "forwarded",
] as const;

const TRUSTED_UA_HEADERS = [
  "x-original-user-agent",
  "x-device-user-agent",
  "user-agent",
] as const;

type VisitPayload = {
  session_id: string;
  page_path: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  user_id?: string;
};

type GeoResult = { country_code: string; city_name: string };

function isBot(ua: string): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

function getDeviceType(ua: string): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablet";
  return "desktop";
}

function parseForwardedHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/for=(?:"?\[?)([^\]";,\s]+)/i);
  return match?.[1]?.trim() || null;
}

function normalizeIP(rawIp: string | null): string | null {
  if (!rawIp) return null;

  const sanitized = rawIp.replace(/^"|"$/g, "").trim();
  if (!sanitized) return null;

  if (sanitized.includes(",")) {
    return normalizeIP(sanitized.split(",")[0]?.trim() || null);
  }

  if (/^::ffff:/i.test(sanitized)) {
    return sanitized.replace(/^::ffff:/i, "");
  }

  return sanitized;
}

function getClientIP(req: Request): string | null {
  const forwardedIp = parseForwardedHeader(req.headers.get("forwarded"));
  if (forwardedIp) return normalizeIP(forwardedIp);

  for (const header of TRUSTED_IP_HEADERS) {
    const normalized = normalizeIP(req.headers.get(header));
    if (normalized) return normalized;
  }

  return null;
}

function getUserAgent(req: Request): string {
  for (const header of TRUSTED_UA_HEADERS) {
    const value = req.headers.get(header)?.trim();
    if (value) return value;
  }

  return "unknown";
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "_rubi_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function geoLookup(ip: string): Promise<GeoResult> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,city`, {
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return { country_code: "", city_name: "" };

    const data = await res.json();
    return {
      country_code: data.countryCode || "",
      city_name: data.city || "",
    };
  } catch {
    return { country_code: "", city_name: "" };
  }
}

async function getCachedGeo(supabase: ReturnType<typeof createClient>, ipHash: string): Promise<GeoResult | null> {
  const { data, error } = await supabase
    .from("ip_geo_cache")
    .select("country_code, city_name")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (error || !data) return null;

  return {
    country_code: data.country_code || "",
    city_name: data.city_name || "",
  };
}

async function enrichGeoAsync(
  supabase: ReturnType<typeof createClient>,
  params: { visitIds: string[]; ipHash: string; ip: string },
) {
  const geo = await geoLookup(params.ip);
  if (!geo.country_code && !geo.city_name) return;

  await supabase
    .from("ip_geo_cache")
    .upsert(
      {
        ip_hash: params.ipHash,
        country_code: geo.country_code || null,
        city_name: geo.city_name || null,
        last_resolved_at: new Date().toISOString(),
      },
      { onConflict: "ip_hash" },
    );

  await supabase
    .from("site_visits")
    .update({
      country_code: geo.country_code || null,
      city_name: geo.city_name || null,
    })
    .in("id", params.visitIds)
    .is("country_code", null)
    .is("city_name", null);
}

function truncate(val: string | undefined | null, maxLen: number): string | null {
  if (!val) return null;
  return val.slice(0, maxLen);
}

function normalizePayload(body: unknown): VisitPayload[] {
  if (body && typeof body === "object" && Array.isArray((body as { visits?: unknown[] }).visits)) {
    return (body as { visits: VisitPayload[] }).visits;
  }

  if (body && typeof body === "object" && "session_id" in (body as Record<string, unknown>)) {
    return [body as VisitPayload];
  }

  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const visits = normalizePayload(body)
      .filter((visit) => visit?.session_id && visit?.page_path)
      .slice(0, 100);

    if (visits.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ipHash = ip ? await hashIP(ip) : null;
    const cachedGeo = ipHash ? await getCachedGeo(supabase, ipHash) : null;

    const rows = visits.map((visit) => ({
      session_id: visit.session_id,
      page_path: visit.page_path,
      referrer_url: visit.referrer_url || null,
      utm_source: visit.utm_source || null,
      utm_medium: visit.utm_medium || null,
      utm_campaign: visit.utm_campaign || null,
      ip_hash: ipHash,
      country_code: cachedGeo?.country_code || null,
      city_name: cachedGeo?.city_name || null,
      user_agent: userAgent,
      device_type: getDeviceType(userAgent),
      user_id: visit.user_id || null,
      is_bot: isBot(userAgent),
    }));

    const { data: insertedVisits, error } = await supabase
      .from("site_visits")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to track" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ip && ipHash && !cachedGeo && insertedVisits?.length) {
      const visitIds = insertedVisits.map((visit) => visit.id).filter(Boolean);
      if (visitIds.length > 0) {
        EdgeRuntime.waitUntil(enrichGeoAsync(supabase, {
          visitIds,
          ipHash,
          ip,
        }));
      }
    }

    return new Response(JSON.stringify({ ok: true, tracked: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Track visit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
