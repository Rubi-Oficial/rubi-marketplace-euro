import { Link } from "react-router-dom";

interface ProfileServiceChipsProps {
  services: { name: string; slug: string }[];
  limit?: number;
  className?: string;
}

export function ProfileServiceChips({ services, limit, className }: ProfileServiceChipsProps) {
  const visibleServices = typeof limit === "number" ? services.slice(0, limit) : services;

  if (visibleServices.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {visibleServices.map((service) => (
          <Link
            key={service.slug}
            to={`/buscar?service=${service.slug}`}
            className="rounded-full border border-border/40 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            {service.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
