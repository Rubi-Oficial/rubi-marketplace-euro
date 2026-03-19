import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProfileImage {
  id: string;
  url: string;
}

export function ProfileGallery({
  images,
  name,
}: {
  images: ProfileImage[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border/30 bg-card">
        <p className="text-sm text-muted-foreground">No photos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Carousel className="w-full" opts={{ startIndex: activeIndex }}>
        <CarouselContent>
          {images.map((img, idx) => (
            <CarouselItem key={img.id}>
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted animate-fade-in">
                <img
                  src={img.url}
                  alt={`${name} — photo ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-3 bg-background/60 backdrop-blur-sm border-border/30 hover:bg-background/80" />
            <CarouselNext className="right-3 bg-background/60 backdrop-blur-sm border-border/30 hover:bg-background/80" />
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                idx === activeIndex
                  ? "border-primary shadow-[0_0_10px_hsl(350_65%_52%_/_0.3)]"
                  : "border-border/30 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
