import { User } from "lucide-react";

/**
 * Placeholder for profiles with no photos — shows initials.
 */
export function ProfilePlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/60">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-3">
        <User className="h-10 w-10 text-primary/40" />
      </div>
      <span className="text-lg font-display font-bold text-muted-foreground/50 tracking-wider">
        {initials}
      </span>
    </div>
  );
}
