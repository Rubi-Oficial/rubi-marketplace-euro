import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import logoVelvetVip from "@/assets/logo-velvet-vip.png";

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

const BrandLogo = forwardRef<HTMLSpanElement, BrandLogoProps>(
  ({ className, imgClassName, alt = "Velvet Escorts VIP" }, ref) => {
    return (
      <span ref={ref} className={cn("inline-flex items-center", className)}>
        <img
          src={logoVelvetVip}
          alt={alt}
          className={cn("h-8 w-auto object-contain", imgClassName)}
          loading="eager"
        />
      </span>
    );
  }
);
BrandLogo.displayName = "BrandLogo";

export default BrandLogo;
