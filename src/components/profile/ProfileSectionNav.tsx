import { useEffect, useMemo, useState } from "react";

interface NavItem {
  id: string;
  label: string;
  enabled?: boolean;
}

interface ProfileSectionNavProps {
  items: NavItem[];
  className?: string;
}

export function ProfileSectionNav({ items, className = "" }: ProfileSectionNavProps) {
  const visibleItems = useMemo(() => items.filter((item) => item.enabled !== false), [items]);
  const [activeId, setActiveId] = useState<string>(visibleItems[0]?.id || "");

  useEffect(() => {
    if (visibleItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entryInView = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (entryInView?.target?.id) {
          setActiveId(entryInView.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.15, 0.3, 0.6],
      }
    );

    visibleItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleItems]);

  if (visibleItems.length === 0) return null;

  return (
    <nav
      aria-label="Navegação de seções do perfil"
      className={`-mx-4 border-y border-border/20 bg-background/80 px-4 py-2 backdrop-blur-xl ${className}`}
    >
      <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeId === item.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
