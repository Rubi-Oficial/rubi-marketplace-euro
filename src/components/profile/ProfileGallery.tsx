import { useEffect, useState, useRef } from "react";
import { Play } from "lucide-react";
import {
  Carousel,
  CarouselApi,
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
  const [api, setApi] = useState<CarouselApi>();
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (allMedia.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-border/30 bg-card">
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
    <div className="space-y-3 md:space-y-4">
      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {allMedia.map((item, idx) => (
            <CarouselItem key={item.id}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted animate-fade-in lg:aspect-[16/18]">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`${name} — photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <button
                    type="button"
                    className="group relative h-full w-full cursor-pointer"
                    onClick={() => handleVideoClick(item.id)}
                    aria-label="Reproduzir vídeo"
                  >
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(item.id, el);
                      }}
                      src={item.url}
                      className="h-full w-full object-cover"
                      preload="metadata"
                      playsInline
                      loop
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
                        <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {allMedia.length > 1 && (
          <>
            <CarouselPrevious className="left-3 h-9 w-9 border-border/30 bg-background/70 backdrop-blur-sm hover:bg-background/90" />
            <CarouselNext className="right-3 h-9 w-9 border-border/30 bg-background/70 backdrop-blur-sm hover:bg-background/90" />
          </>
        )}
      </Carousel>

      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:gap-2.5">
          {allMedia.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => api?.scrollTo(idx)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 md:h-[72px] md:w-[72px] ${
                idx === activeIndex
                  ? "scale-[1.01] border-primary shadow-[0_0_0_2px_hsl(350_65%_52%_/_0.15)]"
                  : "border-border/30 opacity-80 hover:opacity-100"
              }`}
              aria-label={`Abrir mídia ${idx + 1}`}
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
