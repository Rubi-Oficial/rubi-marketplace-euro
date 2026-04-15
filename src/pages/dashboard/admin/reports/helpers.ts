import { startOfDay, endOfDay, subDays } from "date-fns";
import type { DatePreset, DateRange } from "./types";

export function getDateRange(
  preset: DatePreset,
  custom: DateRange
): { from: string | null; to: string | null } {
  const now = new Date();
  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
    case "30d":
      return { from: startOfDay(subDays(now, 30)).toISOString(), to: endOfDay(now).toISOString() };
    case "90d":
      return { from: startOfDay(subDays(now, 90)).toISOString(), to: endOfDay(now).toISOString() };
    case "custom":
      return {
        from: custom.from ? startOfDay(custom.from).toISOString() : null,
        to: custom.to ? endOfDay(custom.to).toISOString() : endOfDay(now).toISOString(),
      };
    default:
      return { from: null, to: null };
  }
}
