import { Link } from "react-router-dom";

interface ProfileRelatedLinksProps {
  cityName?: string | null;
  citySlug?: string | null;
  category?: string | null;
  services: { name: string; slug: string }[];
}

export function ProfileRelatedLinks({ cityName, citySlug, category, services }: ProfileRelatedLinksProps) {
  const topServices = services.slice(0, 2);
  const categorySlug = category?.toLowerCase().replace(/\s+/g, "-");

  return (
    <section className="rounded-2xl border border-border/30 bg-card/55 p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">Continue explorando</h2>
      <p className="mt-1 text-sm text-muted-foreground">Atalhos rápidos para encontrar perfis semelhantes.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {citySlug && cityName && (
          <Link
            to={`/cidade/${citySlug}`}
            className="rounded-full border border-border/40 bg-background px-3 py-1.5 hover:border-primary/40"
          >
            Perfis em {cityName}
          </Link>
        )}

        {category && categorySlug && (
          <Link
            to={`/categoria/${categorySlug}`}
            className="rounded-full border border-border/40 bg-background px-3 py-1.5 hover:border-primary/40"
          >
            Categoria {category}
          </Link>
        )}

        {topServices.map((service) => (
          <Link
            key={service.slug}
            to={`/buscar?service=${service.slug}`}
            className="rounded-full border border-border/40 bg-background px-3 py-1.5 hover:border-primary/40"
          >
            Buscar por {service.name}
          </Link>
        ))}

        <Link to="/buscar" className="rounded-full border border-border/40 bg-background px-3 py-1.5 hover:border-primary/40">
          Ver todos os perfis
        </Link>
      </div>
    </section>
  );
}
