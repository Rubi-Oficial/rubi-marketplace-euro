import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-6 pb-3 md:pt-14 md:pb-8 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/12 via-accent/5 to-transparent pointer-events-none animate-gradient-shift" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,hsl(var(--primary)_/_0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(278_31%_51%_/_0.04),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mx-auto mb-4 md:mb-5 h-px w-20 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-fade-in" />
        <h1 className="font-display text-[1.75rem] font-bold text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-balance animate-fade-in">
          {t("home.h1")}
        </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed text-pretty animate-fade-in" style={{ animationDelay: "100ms" }}>
          {t("home.subtitle")}
        </p>
        {/* Breadcrumb — desktop only */}
        <nav aria-label="Breadcrumb" className="hidden md:block mt-6 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "200ms" }}>
          <ol className="flex items-center justify-center gap-2 flex-wrap">
            <li className="text-foreground font-medium">Home</li>
            <li className="text-border/60">/</li>
            <li><Link to="/es" className="hover:text-foreground transition-colors duration-200">Europa</Link></li>
            <li className="text-border/60">/</li>
            <li><Link to="/buscar" className="hover:text-foreground transition-colors duration-200">Explorar perfis</Link></li>
          </ol>
        </nav>
      </div>
    </section>
  );
}
