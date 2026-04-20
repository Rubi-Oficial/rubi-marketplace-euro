import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  sublabel?: string;
  highlight?: boolean;
}

/**
 * Unified stat card. Supports optional icon, sublabel, and highlighted variant.
 * Use across all dashboards (admin reports, affiliates, client, escort).
 */
export function StatCard({ icon, label, value, sublabel, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 sm:p-5",
        highlight ? "border-primary/30" : "border-border"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs sm:text-sm">{label}</p>
      </div>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

/**
 * Quick action link card with icon and label.
 */
export function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      {icon}
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
