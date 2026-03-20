import { useState } from "react";
import { MapPin, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function LocationBody({ selectedCountry, selectedCity, onApply, countries, getCitiesByCountry, onClose, suggestedCountry }: Omit<LocationModalProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [country, setCountry] = useState(selectedCountry);
  const [city, setCity] = useState(selectedCity);

  const cities = country ? getCitiesByCountry(country) : [];

  const handleCountrySelect = (slug: string) => {
    if (country === slug) {
      setCountry("");
      setCity("");
    } else {
      setCountry(slug);
      setCity("");
    }
  };

  const handleApply = () => {
    onApply(country, city);
    onClose();
  };

  const handleClear = () => {
    setCountry("");
    setCity("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-1 px-1">
        {/* Countries */}
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Country</p>
          <div className="space-y-0.5">
            {countries.map((c) => (
              <button
                key={c.slug}
                onClick={() => handleCountrySelect(c.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  country === c.slug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {c.name}
                </span>
                {country === c.slug ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cities */}
        {cities.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">City</p>
            <div className="space-y-0.5">
              {cities.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCity(city === c.slug ? "" : c.slug)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    city === c.slug
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="pl-6">{c.name}</span>
                  {city === c.slug && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-4 mt-2">
        {(country || city) ? (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        ) : (
          <span />
        )}
        <Button variant="premium" size="sm" className="px-6" onClick={handleApply}>
          Apply
        </Button>
      </div>
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
