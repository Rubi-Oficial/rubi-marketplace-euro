import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/lib/storageUrls";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface ProfileVideo {
  id: string;
  profile_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  duration_seconds: number;
  display_name: string;
  city: string | null;
  slug: string | null;
  video_url: string;
  thumb_url: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function fetchProfileVideos(filters?: {
  city_slug?: string;
  service_slug?: string;
}): Promise<ProfileVideo[]> {
  try {
    let profileQuery = supabase
      .from("eligible_profiles")
      .select("id, display_name, city, city_slug, slug");

    if (filters?.city_slug) profileQuery = profileQuery.eq("city_slug", filters.city_slug);

    const { data: profiles } = await profileQuery.limit(50);
    if (!profiles || profiles.length === 0) return [];

    let profileIds = profiles.map((p: any) => p.id).filter(Boolean) as string[];

    if (filters?.service_slug && profileIds.length > 0) {
      const { data: svcData } = await supabase
        .from("services").select("id").eq("slug", filters.service_slug).single();
      if (svcData) {
        const { data: psData } = await supabase
          .from("profile_services")
          .select("profile_id")
          .eq("service_id", svcData.id)
          .in("profile_id", profileIds);
        if (psData) profileIds = psData.map((ps: any) => ps.profile_id);
        else return [];
      }
    }

    if (profileIds.length === 0) return [];

    const { data: videos } = await supabase
      .from("profile_videos")
      .select("id, profile_id, storage_path, thumbnail_path, duration_seconds")
      .eq("moderation_status", "approved")
      .in("profile_id", profileIds)
      .order("sort_order", { ascending: true });

    if (!videos || videos.length === 0) return [];

    // Collect all paths to sign in a single batch
    const allPaths: string[] = [];
    for (const v of videos) {
      allPaths.push(v.storage_path);
      if (v.thumbnail_path) allPaths.push(v.thumbnail_path);
    }

    const signedMap = await getSignedUrls(allPaths);
    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

    return videos.map((v: any) => {
      const profile = profileMap.get(v.profile_id) || {};
      return {
        ...v,
        display_name: (profile as any).display_name || "Unknown",
        city: (profile as any).city || null,
        slug: (profile as any).slug || null,
        video_url: signedMap[v.storage_path] || "",
        thumb_url: v.thumbnail_path ? signedMap[v.thumbnail_path] || null : null,
      };
    }).filter((v: ProfileVideo) => v.video_url); // exclude videos without valid signed URL
  } catch (err) {
    console.error("[VideoSection] Unexpected error fetching videos:", err);
    return [];
  }
}

const VideoCard = forwardRef<HTMLDivElement, { video: ProfileVideo }>(({ video }, _ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useLanguage();

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-muted" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumb_url || undefined}
          className="h-full w-full object-cover"
          preload="metadata"
          playsInline
          muted
          loop
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        {video.duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0">
          <Link
            to={video.slug ? `/perfil/${video.slug}` : "#"}
            className="block truncate text-sm font-semibold text-primary hover:underline"
          >
            {video.display_name}
          </Link>
          {video.city && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {video.city}
            </span>
          )}
        </div>
        <Link
          to={video.slug ? `/perfil/${video.slug}` : "#"}
          className="shrink-0 rounded-md border border-border/40 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {t("common.details")}
        </Link>
      </div>
    </div>
  );
});
VideoCard.displayName = "VideoCard";

export function VideoSection({ filters }: { filters: { activeCity: string; activeService: string } }) {
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setLoading(true);
    fetchProfileVideos({
      city_slug: filters.activeCity || undefined,
      service_slug: filters.activeService || undefined,
    }).then((data) => {
      setVideos(data);
      setLoading(false);
    });
  }, [filters.activeCity, filters.activeService]);

  if (!loading && videos.length === 0) return null;

  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      {/* Base deep gradient — premium dark with ruby/purple depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(274_36%_10%)] via-[hsl(275_48%_18%)] to-[hsl(278_31%_12%)]" />

      {/* Ruby glow accent — top center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(278_55%_45%_/_0.35),transparent_60%)]" />

      {/* Gold luminous accent — bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(41_49%_69%_/_0.15),transparent_55%)]" />

      {/* Side vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Decorative diagonal light streak */}
      <div className="absolute -top-1/2 -right-1/4 w-[60%] h-[200%] bg-gradient-to-b from-transparent via-[hsl(41_49%_69%_/_0.06)] to-transparent rotate-12 blur-3xl pointer-events-none" />

      {/* Hairline gold dividers top + bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-px w-16 bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.7)] to-transparent" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground drop-shadow-[0_2px_20px_hsl(0_0%_0%_/_0.5)]">
            {t("video.latest")}
          </h2>
          <p className="mt-2 text-sm text-foreground/70">
            {t("video.exclusive")}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted/30 aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}