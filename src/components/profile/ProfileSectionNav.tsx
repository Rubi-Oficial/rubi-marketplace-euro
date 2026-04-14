import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface NavItem {
  id: string;
  label: string;
  enabled?: boolean;
}

interface ProfileSectionNavProps {
  items: NavItem[];
  className?: string;
}

const PUBLIC_LAYOUT_HEADER_OFFSET_PX = 104; // matches PublicLayout pt-[6.5rem]
const SECTION_NAV_GAP_PX = 28;

export function ProfileSectionNav({ items, className = "" }: ProfileSectionNavProps) {
  const visibleItems = useMemo(() => items.filter((item) => item.enabled !== false), [items]);
  const [activeId, setActiveId] = useState<string>(visibleItems[0]?.id || "");
  const navRef = useRef<HTMLElement | null>(null);

  const getSectionScrollOffset = useCallback(() => {
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 0;
    return Math.round(PUBLIC_LAYOUT_HEADER_OFFSET_PX + navHeight + SECTION_NAV_GAP_PX);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    document.documentElement.style.setProperty("--profile-section-nav-offset", `${getSectionScrollOffset()}px`);

    return () => {
      document.documentElement.style.removeProperty("--profile-section-nav-offset");
    };
  }, [getSectionScrollOffset]);

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
        rootMargin: "-28% 0px -55% 0px",
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

  const onNavClick = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const dynamicOffset = getSectionScrollOffset();

    const targetTop = target.getBoundingClientRect().top + window.scrollY - dynamicOffset;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    setActiveId(sectionId);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Navegação de seções do perfil"
      className={`-mx-4 border-y border-border/20 bg-background/85 px-4 py-2 backdrop-blur-xl ${className}`}
    >
      <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavClick(item.id)}
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeId === item.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-current={activeId === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
