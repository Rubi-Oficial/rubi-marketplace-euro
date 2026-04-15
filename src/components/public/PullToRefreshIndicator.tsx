import { Loader2 } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
}

export function PullToRefreshIndicator({ pullDistance, refreshing }: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
      style={{ height: `${pullDistance}px` }}
    >
      <Loader2
        className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
        style={{
          opacity: Math.min(pullDistance / 80, 1),
          transform: `rotate(${pullDistance * 3}deg)`,
        }}
      />
    </div>
  );
}
