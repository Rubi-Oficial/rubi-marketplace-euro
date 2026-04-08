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
      <div
        ref={ref}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl md:hidden safe-area-bottom"
        role="toolbar"
        aria-label="Filters"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className={`h-11 flex-1 rounded-full border-border bg-card/70 text-sm font-medium transition-all duration-200 ${
              hasGeneralFilter ? "border-primary/50 text-primary bg-primary/10" : ""
            }`}
            aria-label={`${t("landing.filters")}${hasGeneralFilter ? ` (${generalCount} active)` : ""}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("landing.filters")}
            {hasGeneralFilter && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {generalCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLocation}
            className={`h-11 flex-1 rounded-full border-border bg-card/70 text-sm font-medium transition-all duration-200 ${
              hasLocationFilter ? "border-primary/50 text-primary bg-primary/10" : ""
            }`}
            aria-label={`${t("landing.location")}${hasLocationFilter ? ` (${locationCount} active)` : ""}`}
          >
            <MapPin className="mr-2 h-4 w-4" />
            {t("landing.location")}
            {hasLocationFilter && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
