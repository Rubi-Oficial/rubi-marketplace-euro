import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/lib/storageUrls";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { getCanonicalSeoProfilePath, LOCAL_SEO_CITIES, MARKET_LABEL } from "@/config/localSeoPages";
import { ProfileSectionNav } from "@/components/profile/ProfileSectionNav";
import { ProfileDesktopSidebar } from "@/components/profile/ProfileDesktopSidebar";
import { ProfileRelatedLinks } from "@/components/profile/ProfileRelatedLinks";
import { ProfileFloatingActionsMobile } from "@/components/profile/ProfileFloatingActionsMobile";
import { ProfileOverviewSection } from "@/components/profile/ProfileOverviewSection";
import { ProfileServicesSection } from "@/components/profile/ProfileServicesSection";
import { ProfilePricingSection } from "@/components/profile/ProfilePricingSection";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";

interface PublicProfile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  city_slug: string | null;
  country: string | null;
  category: string | null;
  bio: string | null;
  languages: string[] | null;
  pricing_from: number | null;
  whatsapp: string | null;
  telegram: string | null;
  slug: string | null;
  is_featured: boolean;
}

interface MediaItem {
  id: string;
  storage_path: string;
  sort_order: number;
  url: string;
}

const SECTION_STYLE = { scrollMarginTop: "var(--profile-section-nav-offset, 108px)" } as const;

export default function ProfilePage() {
  const { t } = useLanguage();
  const { slug, market, cityBase, pageSlug } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setError(null);

        const { data: eligible, error: eligibleErr } = await supabase
          .from("eligible_profiles")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (eligibleErr) {
          console.error("[ProfilePage] Failed to fetch profile:", eligibleErr.message);
          setError("Não foi possível carregar o perfil. Tente novamente.");
          setLoading(false);
          return;
        }

        if (!eligible) {
          setLoading(false);
          return;
        }

        const [contactResult, imgResult, vidResult, psResult] = await Promise.all([
          supabase.rpc("get_profile_contact", { p_profile_id: eligible.id }),
          supabase
            .from("profile_images")
            .select("id, storage_path, sort_order")
            .eq("profile_id", eligible.id)
            .eq("moderation_status", "approved")
            .order("sort_order"),
          supabase
            .from("profile_videos")
            .select("id, storage_path, sort_order")
            .eq("profile_id", eligible.id)
            .eq("moderation_status", "approved")
            .order("sort_order"),
          supabase
            .from("profile_services")
            .select("service_id, services!inner(name, slug)")
            .eq("profile_id", eligible.id),
        ]);

        const contact = contactResult.data as { whatsapp: string | null; telegram: string | null } | null;
        const mappedProfile: PublicProfile = {
          id: eligible.id ?? "",
          display_name: eligible.display_name ?? "",
          age: eligible.age ?? null,
          city: eligible.city ?? null,
          city_slug: eligible.city_slug ?? null,
          country: eligible.country ?? null,
          category: eligible.category ?? null,
          bio: eligible.bio ?? null,
          languages: eligible.languages ?? null,
          pricing_from: eligible.pricing_from ?? null,
          slug: eligible.slug ?? null,
          is_featured: eligible.is_featured ?? false,
          whatsapp: contact?.whatsapp ?? null,
          telegram: contact?.telegram ?? null,
        };
        setProfile(mappedProfile);

        const allPaths: string[] = [];
        const imgData = imgResult.data ?? [];
        const vidData = vidResult.data ?? [];

        if (imgResult.error) console.error("[ProfilePage] Failed to fetch images:", imgResult.error.message);
        if (vidResult.error) console.error("[ProfilePage] Failed to fetch videos:", vidResult.error.message);

        imgData.forEach((img) => allPaths.push(img.storage_path));
        vidData.forEach((video) => allPaths.push(video.storage_path));

        const signedMap = allPaths.length > 0 ? await getSignedUrls(allPaths) : {};

        setImages(
          imgData.map((img) => ({
            ...img,
            url: signedMap[img.storage_path] || "",
          }))
        );

        setVideos(
          vidData.map((video) => ({
            ...video,
            url: signedMap[video.storage_path] || "",
          }))
        );

        const psData = psResult.data;
        if (psData && psData.length > 0) {
          const svcList = psData
            .map((record: any) => record.services)
            .filter(Boolean)
            .map((service: any) => ({ name: service.name, slug: service.slug }));
          setServices(svcList);
        }

        supabase
          .from("leads")
          .insert({ profile_id: eligible.id, source: "profile_view" })
          .then(({ error: leadErr }) => {
            if (leadErr) console.warn("[ProfilePage] Lead insert failed:", leadErr.message);
          });

        setLoading(false);
      } catch (err) {
        console.error("[ProfilePage] Unexpected error:", err);
        setError("Ocorreu um erro inesperado. Tente novamente.");
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const trackWhatsapp = useCallback(() => {
    if (!profile?.id) return;
    supabase.from("leads").insert({ profile_id: profile.id, source: "whatsapp_click" });
  }, [profile?.id]);

  const trackTelegram = useCallback(() => {
    if (!profile?.id) return;
    supabase.from("leads").insert({ profile_id: profile.id, source: "telegram_click" });
  }, [profile?.id]);

  const canonicalProfilePath = useMemo(() => {
    if (!slug) return "/perfil";
    if (profile?.city_slug) return getCanonicalSeoProfilePath(profile.city_slug, slug);
    return market && cityBase ? `/${market}/${cityBase}/modelo/${slug}` : `/perfil/${slug}`;
  }, [slug, profile?.city_slug, market, cityBase]);

  const profileJsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: profile.display_name,
      url: `${SITE_URL}${canonicalProfilePath}`,
      mainEntity: {
        "@type": "Person",
        name: profile.display_name,
        address: profile.city
          ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: profile.country || "NL" }
          : undefined,
        image: images[0]?.url,
      },
    };
  }, [profile, images, canonicalProfilePath]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ name: "Home", url: SITE_URL }];
    const seoCity = LOCAL_SEO_CITIES.find((city) => city.citySlug === profile?.city_slug);
    if (seoCity) {
      crumbs.push({ name: MARKET_LABEL[seoCity.market], url: `${SITE_URL}/${seoCity.market}` });
      crumbs.push({ name: seoCity.cityName, url: `${SITE_URL}${seoCity.basePath}` });
      if (pageSlug) {
        crumbs.push({ name: "Modelo", url: `${SITE_URL}${seoCity.basePath}/modelo/${slug}` });
      }
    } else {
      if (profile?.category) {
        const catSlug = profile.category.toLowerCase().replace(/\s+/g, "-");
        crumbs.push({ name: profile.category, url: `${SITE_URL}/categoria/${catSlug}` });
      }
      if (profile?.city && profile?.city_slug) {
        crumbs.push({ name: profile.city, url: `${SITE_URL}/cidade/${profile.city_slug}` });
      }
    }
    if (profile) {
      crumbs.push({ name: profile.display_name, url: `${SITE_URL}${canonicalProfilePath}` });
    }
    return crumbs;
  }, [profile, canonicalProfilePath, pageSlug, slug]);

  usePageMeta({
    title: profile ? `${profile.display_name} en ${profile.city || "Europa"} | Perfil verificado` : "Profile",
    description: profile
      ? `Perfil de ${profile.display_name} en ${profile.city || "Europa"}. Fotos, descripción, servicios y contacto directo.`
      : "Profile on Rubi Girls",
    path: canonicalProfilePath,
    image: images[0]?.url,
    imageAlt: profile ? `${profile.display_name} profile photo` : undefined,
    type: "profile",
    jsonLd: profileJsonLd,
    breadcrumbs,
  });

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h1 className="font-display text-2xl font-bold text-foreground">Erro ao carregar</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/buscar">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("profile.unavailable")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.unavailable_desc")}</p>
        <Button variant="ghost" className="mt-6" asChild>
          <Link to="/buscar">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("profile.browse")}
          </Link>
        </Button>
      </div>
    );
  }

  const hasServices = services.length > 0;
  const hasMobileFloatingBar = Boolean(profile.whatsapp || profile.telegram);

  const navItems = [
    { id: "overview", label: "Visão geral", enabled: true },
    { id: "services", label: "Serviços", enabled: hasServices },
    { id: "pricing", label: "Preços", enabled: true },
    { id: "contact", label: "Contato", enabled: true },
  ];

  return (
    <div className="container mx-auto animate-fade-in px-4 py-4 md:py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-[11px] text-muted-foreground md:text-xs">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.url} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-border">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="max-w-[190px] truncate text-foreground md:max-w-none">{crumb.name}</span>
              ) : (
                <Link to={crumb.url.replace(SITE_URL, "") || "/"} className="transition-colors hover:text-foreground">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <section className="grid gap-5 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-8">
          <ProfileGallery images={images} videos={videos} name={profile.display_name} />

          <div className="lg:hidden">
            <ProfileInfo
              profile={profile}
              services={services}
              showContactButtons={false}
              maxServices={6}
              onWhatsappClick={trackWhatsapp}
              onTelegramClick={trackTelegram}
            />
          </div>
        </div>

        <div className="lg:col-span-4">
          <ProfileDesktopSidebar
            profile={profile}
            services={services}
            onWhatsappClick={trackWhatsapp}
            onTelegramClick={trackTelegram}
          />
        </div>
      </section>

      <ProfileSectionNav items={navItems} className="sticky top-0 z-30 mt-4 lg:mt-6" />

      <main className={`mt-6 space-y-6 ${hasMobileFloatingBar ? "pb-28" : "pb-10"}`}>
        <ProfileOverviewSection bio={profile.bio} sectionStyle={SECTION_STYLE} />

        <ProfileServicesSection services={services} sectionStyle={SECTION_STYLE} />

        <ProfilePricingSection pricingFrom={profile.pricing_from} sectionStyle={SECTION_STYLE} />

        <ProfileContactSection
          whatsapp={profile.whatsapp}
          telegram={profile.telegram}
          sectionStyle={SECTION_STYLE}
          onWhatsappClick={trackWhatsapp}
          onTelegramClick={trackTelegram}
        />

        <ProfileRelatedLinks
          cityName={profile.city}
          citySlug={profile.city_slug}
          category={profile.category}
          services={services}
        />
      </main>

      <ProfileFloatingActionsMobile
        whatsapp={profile.whatsapp}
        telegram={profile.telegram}
        onWhatsappClick={trackWhatsapp}
        onTelegramClick={trackTelegram}
      />
    </div>
  );
}
