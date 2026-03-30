import React from "react";
import { SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface MobileFilterBarProps {
  hasGeneralFilter: boolean;
  hasLocationFilter: boolean;
  generalCount: number;
  locationCount: number;
  onOpenFilters: () => void;
  onOpenLocation: () => void;
}

export const MobileFilterBar = React.forwardRef<HTMLDivElement, MobileFilterBarProps>(
  ({ hasGeneralFilter, hasLocationFilter, generalCount, locationCount, onOpenFilters, onOpenLocation }, ref) => {
    const { t } = useLanguage();

    return (
      <div ref={ref} className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className={`h-10 flex-1 rounded-full border-border/50 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            {t("landing.filters")}
            {hasGeneralFilter && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {generalCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLocation}
            className={`h-10 flex-1 rounded-full border-border/50 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
          >
            <MapPin className="mr-2 h-3.5 w-3.5" />
            {t("landing.location")}
            {hasLocationFilter && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {locationCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }
);
MobileFilterBar.displayName = "MobileFilterBar";
