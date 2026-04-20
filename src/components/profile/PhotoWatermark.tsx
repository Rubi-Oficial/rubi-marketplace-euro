import { cn } from "@/lib/utils";
import logoVelvetVip from "@/assets/logo-velvet-vip.png";

interface PhotoWatermarkProps {
  /** Visual size variant. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Subtle centered watermark overlay applied on top of profile photos
 * using the Velvet Escorts VIP logo to discourage unauthorized reuse.
 * Pointer-events disabled so it never blocks card clicks or navigation.
 */
export function PhotoWatermark({ size = "md", className }: PhotoWatermarkProps) {
  const sizeClass =
    size === "sm"
      ? "w-24 md:w-28"
      : size === "lg"
      ? "w-56 md:w-72"
      : "w-40 md:w-48";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[2] flex items-center justify-center select-none",
        className
      )}
    >
      <img
        src={logoVelvetVip}
        alt=""
        draggable={false}
        className={cn(
          "object-contain opacity-20 mix-blend-screen rotate-[-12deg]",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]",
          sizeClass
        )}
      />
    </div>
  );
}
