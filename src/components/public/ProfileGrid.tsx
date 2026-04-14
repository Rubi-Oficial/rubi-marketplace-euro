import React from "react";
import { ProfileCard } from "@/components/public/ProfileCard";
import type { EligibleProfile } from "@/lib/profileApi";

interface ProfileGridProps {
  profiles: EligibleProfile[];
  columns?: string;
}

export const ProfileGrid = React.forwardRef<HTMLDivElement, ProfileGridProps>(
  ({ profiles, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-5 sm:gap-6 lg:gap-7 ${columns}`}>
      {profiles.map((p, i) => (
        <ProfileCard key={p.id} profile={p} index={i} />
      ))}
    </div>
  )
);
ProfileGrid.displayName = "ProfileGrid";

export const ProfileGridSkeleton = React.forwardRef<HTMLDivElement, { count?: number; columns?: string }>(
  ({ count = 8, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-5 sm:gap-6 lg:gap-7 ${columns}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer bg-card/40 border border-border/10" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
);
ProfileGridSkeleton.displayName = "ProfileGridSkeleton";
