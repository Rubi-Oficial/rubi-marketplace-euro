import { useState, useRef } from "react";
import { Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

export function ProfileGallery({
  images,
  videos = [],
  name,
}: {
  images: { id: string; url: string }[];
  videos?: { id: string; url: string }[];
  name: string;
}) {
  const allMedia: MediaItem[] = [
    ...images.map((img) => ({ ...img, type: "image" as const })),
    ...videos.map((vid) => ({ ...vid, type: "video" as const })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  if (allMedia.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border/30 bg-card">
        <p className="text-sm text-muted-foreground">No media</p>
      </div>
    );
  }

  const handleVideoClick = (id: string) => {
    const el = videoRefs.current.get(id);
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  return (
    <div className="space-y-3">
      <Carousel className="w-full" opts={{ startIndex: activeIndex }}>
        <CarouselContent>
          {allMedia.map((item, idx) => (
            <CarouselItem key={item.id}>
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted animate-fade-in relative">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`${name} — photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="relative h-full w-full cursor-pointer group" onClick={() => handleVideoClick(item.id)}>
                    <video
                      ref={(el) => { if (el) videoRefs.current.set(item.id, el); }}
                      src={item.url}
                      className="h-full w-full object-cover"
                      preload="metadata"
                      playsInline
                      loop
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                        <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {allMedia.length > 1 && (
          <>
            <CarouselPrevious className="left-3 bg-background/60 backdrop-blur-sm border-border/30 hover:bg-background/80" />
            <CarouselNext className="right-3 bg-background/60 backdrop-blur-sm border-border/30 hover:bg-background/80" />
          </>
        )}
      </Carousel>

      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allMedia.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                idx === activeIndex
                  ? "border-primary shadow-[0_0_10px_hsl(350_65%_52%_/_0.3)]"
                  : "border-border/30 opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === "image" ? (
                <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="relative h-full w-full bg-muted">
                  <video src={item.url} className="h-full w-full object-cover" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-3 w-3 text-white" fill="currentColor" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
