import { ProfileCard } from "@/components/public/ProfileCard";
import type { EligibleProfile } from "@/lib/profileApi";

interface ProfileGridProps {
  profiles: EligibleProfile[];
  columns?: string;
}

export function ProfileGrid({ profiles, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" }: ProfileGridProps) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {profiles.map((p) => (
        <ProfileCard key={p.id} profile={p} />
      ))}
    </div>
  );
}

export function ProfileGridSkeleton({ count = 8, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" }: { count?: number; columns?: string }) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
