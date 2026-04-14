import React from "react";
import { AnimatePresence } from "framer-motion";
import { ProfileCard } from "@/components/public/ProfileCard";
import type { EligibleProfile } from "@/lib/profileApi";

interface ProfileGridProps {
  profiles: EligibleProfile[];
  columns?: string;
}

export const ProfileGrid = React.forwardRef<HTMLDivElement, ProfileGridProps>(
  ({ profiles, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-4 sm:gap-5 lg:gap-6 ${columns}`}>
      <AnimatePresence mode="popLayout">
        {profiles.map((p, i) => (
          <ProfileCard key={p.id} profile={p} index={i} />
        ))}
      </AnimatePresence>
    </div>
  )
);
ProfileGrid.displayName = "ProfileGrid";

export const ProfileGridSkeleton = React.forwardRef<HTMLDivElement, { count?: number; columns?: string }>(
  ({ count = 8, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, ref) => (
    <div ref={ref} className={`grid gap-4 sm:gap-5 lg:gap-6 ${columns}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer" />
      ))}
    </div>
  )
);
ProfileGridSkeleton.displayName = "ProfileGridSkeleton";
