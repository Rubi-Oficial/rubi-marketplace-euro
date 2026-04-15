import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter } from "lucide-react";
import type { DatePreset, DateRange } from "./types";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
  { value: "custom", label: "Personalizado" },
];

interface Props {
  preset: DatePreset;
  range: DateRange;
  onPresetChange: (p: DatePreset) => void;
  onRangeChange: (r: DateRange) => void;
}

export function DateRangeFilter({ preset, range, onPresetChange, onRangeChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">Período:</span>
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => onPresetChange(p.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            preset === p.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <CalendarIcon className="h-3 w-3" />
                {range.from ? format(range.from, "dd/MM/yyyy") : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={range.from}
                onSelect={(d) => onRangeChange({ ...range, from: d })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <CalendarIcon className="h-3 w-3" />
                {range.to ? format(range.to, "dd/MM/yyyy") : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={range.to}
                onSelect={(d) => onRangeChange({ ...range, to: d })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      {preset !== "all" && range.from && (
        <span className="text-[10px] text-muted-foreground ml-1">
          {format(range.from, "dd/MM/yyyy")} — {range.to ? format(range.to, "dd/MM/yyyy") : "hoje"}
        </span>
      )}
    </div>
  );
}
