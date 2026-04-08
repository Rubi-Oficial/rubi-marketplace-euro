import React from "react";
import { ProfileCard } from "@/components/public/ProfileCard";
import type { EligibleProfile } from "@/lib/profileApi";

interface ProfileGridProps {
  profiles: EligibleProfile[];
  columns?: string;
}

export const ProfileGrid = React.forwardRef<HTMLDivElement, ProfileGridProps>(
  ({ profiles, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-6 ${columns}`}>
      {profiles.map((p) => (
        <ProfileCard key={p.id} profile={p} />
      ))}
    </div>
  )
);
ProfileGrid.displayName = "ProfileGrid";

export const ProfileGridSkeleton = React.forwardRef<HTMLDivElement, { count?: number; columns?: string }>(
  ({ count = 8, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-6 ${columns}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-[var(--card-radius)] bg-muted" />
      ))}
    </div>
  )
);
ProfileGridSkeleton.displayName = "ProfileGridSkeleton";
