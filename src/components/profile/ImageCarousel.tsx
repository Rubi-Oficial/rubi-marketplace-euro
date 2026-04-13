import { useState, useEffect, useCallback, useRef, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressiveImage } from "./ProgressiveImage";
import { ProfilePlaceholder } from "./ProfilePlaceholder";

const ROTATION_INTERVAL = 5000;
const PAUSE_AFTER_MANUAL = 10000;

interface ImageCarouselProps {
  urls: string[];
  displayName: string;
  hovered: boolean;
}

/**
 * Auto-rotating image carousel with manual navigation controls.
 */
function ImageCarouselInner({ urls, displayName, hovered }: ImageCarouselProps) {
  const hasMultiple = urls.length > 1;
  const [activeIdx, setActiveIdx] = useState(0);
  const pausedUntilRef = useRef(0);

  useEffect(() => {
    if (!hasMultiple) return;
    const id = setInterval(() => {
      if (hovered) return;
      if (Date.now() < pausedUntilRef.current) return;
      setActiveIdx((i) => (i + 1) % urls.length);
    }, ROTATION_INTERVAL);
    return () => clearInterval(id);
  }, [hasMultiple, hovered, urls.length]);

  const goTo = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx(idx);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    []
  );

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i - 1 + urls.length) % urls.length);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    [urls.length]
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i + 1) % urls.length);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    [urls.length]
  );

  if (urls.length === 0) {
    return <ProfilePlaceholder name={displayName || "?"} />;
  }

  return (
    <>
      {urls.map((url, idx) => (
        <div
          key={url}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            idx === activeIdx ? "opacity-100 z-[1]" : "opacity-0 z-0"
          )}
        >
          {(idx === activeIdx || idx === (activeIdx + 1) % urls.length || idx === (activeIdx - 1 + urls.length) % urls.length) && (
            <ProgressiveImage
              src={url}
              alt={`${displayName} — ${idx + 1}`}
              eager={idx === 0}
            />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {hasMultiple && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/60 active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/60 active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {hasMultiple && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
          {urls.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => goTo(idx, e)}
              className={`rounded-full transition-all duration-300 ${
                idx === activeIdx
                  ? "h-2.5 w-2.5 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                  : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Memoize to avoid re-renders when parent state changes (e.g. hover on sibling cards)
export const ImageCarousel = memo(ImageCarouselInner, (prev, next) => {
  return prev.urls === next.urls
    && prev.displayName === next.displayName
    && prev.hovered === next.hovered;
});
