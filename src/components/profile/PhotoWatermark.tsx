import { cn } from "@/lib/utils";

interface PhotoWatermarkProps {
  /** Override the brand label. Defaults to "Velvet". */
  label?: string;
  /** Visual size variant. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Subtle centered watermark overlay applied on top of profile photos
 * to discourage unauthorized reuse. Pointer-events disabled so it never
 * blocks card clicks or carousel navigation.
 */
export function PhotoWatermark({ label = "Velvet", size = "md", className }: PhotoWatermarkProps) {
  const sizeClass =
    size === "sm"
      ? "text-2xl tracking-[0.4em]"
      : size === "lg"
      ? "text-6xl tracking-[0.55em]"
      : "text-4xl tracking-[0.5em]";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[2] flex items-center justify-center select-none",
        className
      )}
    >
      <span
        className={cn(
          "font-display font-semibold uppercase text-white/15",
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
          "rotate-[-18deg]",
          sizeClass
        )}
        style={{ WebkitTextStroke: "0.5px rgba(255,255,255,0.18)" }}
      >
        {label}
      </span>
    </div>
  );
}
