interface ServiceSlugBarProps {
  services: { id: string; name: string; slug: string }[];
  activeService: string;
  onServiceClick: (slug: string) => void;
}

export function ServiceSlugBar({ services, activeService, onServiceClick }: ServiceSlugBarProps) {
  if (services.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-3">
      <button
        onClick={() => onServiceClick("")}
        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-all shrink-0 ${
          !activeService
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
        }`}
      >
        Todos
      </button>
      {services.map((s) => (
        <button
          key={s.id}
          onClick={() => onServiceClick(s.slug === activeService ? "" : s.slug)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-all shrink-0 ${
            s.slug === activeService
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
