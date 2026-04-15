import { useEffect, useRef, useState } from "react";
import { VideoSection } from "./VideoSection";

interface LazyVideoSectionProps {
  filters: { activeCity: string; activeService: string };
}

export function LazyVideoSection({ filters }: LazyVideoSectionProps) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinelRef} className="min-h-[1px]">
      {visible && <VideoSection filters={filters} />}
    </div>
  );
}
