import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Image with blur-up loading effect.
 */
export function ProgressiveImage({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-all duration-500",
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105"
        )}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </>
  );
}
