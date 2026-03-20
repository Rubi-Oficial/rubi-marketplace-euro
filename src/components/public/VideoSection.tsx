import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";

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
  // Get eligible profiles (with optional filters)
  let profileQuery = supabase
    .from("eligible_profiles")
    .select("id, display_name, city, city_slug, slug");

  if (filters?.city_slug) profileQuery = profileQuery.eq("city_slug", filters.city_slug);

  const { data: profiles } = await profileQuery.limit(50);
  if (!profiles || profiles.length === 0) return [];

  let profileIds = profiles.map((p: any) => p.id).filter(Boolean) as string[];

  // Filter by service if needed
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

  // Get approved videos
  const { data: videos } = await supabase
    .from("profile_videos")
    .select("id, profile_id, storage_path, thumbnail_path, duration_seconds")
    .eq("moderation_status", "approved")
    .in("profile_id", profileIds)
    .order("sort_order", { ascending: true });

  if (!videos || videos.length === 0) return [];

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return videos.map((v: any) => {
    const profile = profileMap.get(v.profile_id) || {};
    return {
      ...v,
      display_name: (profile as any).display_name || "Unknown",
      city: (profile as any).city || null,
      slug: (profile as any).slug || null,
      video_url: `${supabaseUrl}/storage/v1/object/public/profile-images/${v.storage_path}`,
      thumb_url: v.thumbnail_path
        ? `${supabaseUrl}/storage/v1/object/public/profile-images/${v.thumbnail_path}`
        : null,
    };
  });
}

const VideoCard = forwardRef<HTMLDivElement, { video: ProfileVideo }>(({ video }, _ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      {/* Video container */}
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
        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>

      {/* Info bar */}
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
          Details
        </Link>
      </div>
    </div>
  );
});
VideoCard.displayName = "VideoCard";

export function VideoSection({ filters }: { filters: { activeCity: string; activeService: string } }) {
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Don't render the section if no videos and not loading
  if (!loading && videos.length === 0) return null;

  return (
    <section className="border-t border-border/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Latest Videos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exclusive content from verified profiles.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted aspect-[3/4]" />
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
