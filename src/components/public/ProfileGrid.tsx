import React from "react";
import { ProfileCard } from "@/components/public/ProfileCard";
import type { EligibleProfile } from "@/lib/profileApi";

interface ProfileGridProps {
  profiles: EligibleProfile[];
  columns?: string;
}

export const ProfileGrid = React.forwardRef<HTMLDivElement, ProfileGridProps>(
  ({ profiles, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-5 sm:gap-6 lg:gap-7 stagger-children ${columns}`}>
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
        <div
          key={i}
          className="rounded-2xl bg-card/40 border border-border/10 overflow-hidden"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Image skeleton */}
          <div className="h-[320px] sm:h-[380px] animate-shimmer" />
          {/* Content skeleton */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 rounded-full animate-shimmer" style={{ animationDelay: `${i * 80 + 100}ms` }} />
              <div className="h-5 w-8 rounded-full animate-shimmer" style={{ animationDelay: `${i * 80 + 150}ms` }} />
            </div>
            <div className="h-4 w-24 rounded-full animate-shimmer" style={{ animationDelay: `${i * 80 + 200}ms` }} />
            <div className="h-16 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 80 + 250}ms` }} />
            <div className="h-10 rounded-xl animate-shimmer" style={{ animationDelay: `${i * 80 + 300}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
);
ProfileGridSkeleton.displayName = "ProfileGridSkeleton";