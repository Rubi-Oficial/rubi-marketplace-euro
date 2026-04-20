import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-10 pb-6 md:pt-20 md:pb-12 overflow-hidden">
      {/* Base deep gradient — premium dark with ruby/purple depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(274_36%_10%)] via-[hsl(275_48%_18%)] to-[hsl(278_31%_12%)]" />

      {/* Ruby glow accent — top center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(278_55%_45%_/_0.4),transparent_60%)]" />

      {/* Gold luminous accent — bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(41_49%_69%_/_0.15),transparent_55%)]" />

      {/* Side vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Decorative diagonal light streak */}
      <div className="absolute -top-1/2 -right-1/4 w-[60%] h-[200%] bg-gradient-to-b from-transparent via-[hsl(41_49%_69%_/_0.06)] to-transparent rotate-12 blur-3xl pointer-events-none" />

      {/* Hairline gold divider bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mx-auto mb-4 md:mb-6 h-px w-20 bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.7)] to-transparent animate-fade-in" />
        <h1 className="font-display text-[1.75rem] font-bold text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-balance animate-fade-in drop-shadow-[0_2px_20px_hsl(0_0%_0%_/_0.5)]">
          {t("home.h1")}
        </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-base text-foreground/75 max-w-lg mx-auto leading-relaxed text-pretty animate-fade-in" style={{ animationDelay: "100ms" }}>
          {t("home.subtitle")}
        </p>
        {/* Breadcrumb — desktop only */}
        <nav aria-label="Breadcrumb" className="hidden md:block mt-6 text-xs text-foreground/60 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <ol className="flex items-center justify-center gap-2 flex-wrap">
            <li className="text-foreground font-medium">Home</li>
            <li className="text-[hsl(41_49%_69%_/_0.4)]">/</li>
            <li><Link to="/es" className="hover:text-[hsl(41_49%_69%)] transition-colors duration-200">Europa</Link></li>
            <li className="text-[hsl(41_49%_69%_/_0.4)]">/</li>
            <li><Link to="/buscar" className="hover:text-[hsl(41_49%_69%)] transition-colors duration-200">Explorar perfis</Link></li>
          </ol>
        </nav>
      </div>
    </section>
  );
}
