import { cn } from "@/lib/utils";
import logoVelvetVip from "@/assets/logo-velvet-vip.svg";

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export default function BrandLogo({
  className,
  imgClassName,
  alt = "Velvet Escorts VIP",
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={logoVelvetVip}
        alt={alt}
        className={cn("h-8 w-auto object-contain", imgClassName)}
        loading="eager"
      />
    </span>
  );
}
