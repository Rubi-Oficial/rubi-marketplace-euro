import { useState } from "react";
import { MapPin, ChevronRight, ChevronDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Country, City } from "@/hooks/useLocations";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCountry: string;
  selectedCity: string;
  onApply: (country: string, city: string) => void;
  countries: Country[];
  getCitiesByCountry: (slug: string) => City[];
  suggestedCountry?: string;
}

function LocationBody({
  selectedCountry,
  selectedCity,
  onApply,
  countries,
  getCitiesByCountry,
  onClose,
  suggestedCountry,
}: Omit<LocationModalProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [expandedCountry, setExpandedCountry] = useState(selectedCountry);

  const handleCountryClick = (slug: string) => {
    if (expandedCountry === slug) {
      // Collapse — also clear filters for this country
      setExpandedCountry("");
      onApply("", "");
      onClose();
    } else {
      setExpandedCountry(slug);
    }
  };

  const handleCityClick = (countrySlug: string, citySlug: string) => {
    onApply(countrySlug, citySlug);
    onClose();
  };

  const handleCountryOnly = (countrySlug: string) => {
    // "All cities" option — apply country filter without city
    onApply(countrySlug, "");
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-0.5">
          {/* Suggested country hint */}
          {suggestedCountry && !expandedCountry && (() => {
            const suggested = countries.find((c) => c.slug === suggestedCountry);
            if (!suggested) return null;
            return (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground/60 px-3 mb-1">Based on your location</p>
                <button
                  onClick={() => handleCountryClick(suggested.slug)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors text-foreground hover:bg-accent border border-dashed border-primary/20"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {suggested.name}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
              </div>
            );
          })()}

          {countries.map((c) => {
            const isExpanded = expandedCountry === c.slug;
            const cities = isExpanded ? getCitiesByCountry(c.slug) : [];

            return (
              <div key={c.slug}>
                {/* Country row */}
                <button
                  onClick={() => handleCountryClick(c.slug)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isExpanded
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.name}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </button>

                {/* Cities — rendered inline right below the country */}
                {isExpanded && cities.length > 0 && (
                  <div className="ml-4 border-l border-border/30 pl-2 my-1 space-y-0.5">
                    {/* "All cities" option */}
                    <button
                      onClick={() => handleCountryOnly(c.slug)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedCountry === c.slug && !selectedCity
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <span>All cities</span>
                      {selectedCountry === c.slug && !selectedCity && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>

                    {cities.map((city) => (
                      <button
                        key={city.slug}
                        onClick={() => handleCityClick(c.slug, city.slug)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedCity === city.slug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <span>{city.name}</span>
                        {selectedCity === city.slug && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Clear button */}
      {(selectedCountry || selectedCity) && (
        <div className="border-t border-border/20 pt-3 mt-2">
          <button
            onClick={() => {
              onApply("", "");
              onClose();
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear location filter
          </button>
        </div>
      )}
    </div>
  );
}

export function LocationModal(props: LocationModalProps) {
  const isMobile = useIsMobile();
  const { open, onOpenChange, ...bodyProps } = props;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-5 flex flex-col">
          <SheetHeader className="pb-2">
            <SheetTitle className="font-display text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location
            </SheetTitle>
          </SheetHeader>
          <LocationBody {...bodyProps} onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[70vh] flex flex-col p-5" aria-describedby={undefined}>
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location
          </DialogTitle>
        </DialogHeader>
        <LocationBody {...bodyProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
