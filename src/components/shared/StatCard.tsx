import { Link } from "react-router-dom";

/**
 * Small stat card with icon, label, and value.
 */
export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
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
