import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export function CtaSection() {
  const { t } = useLanguage();

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Base deep gradient — premium dark with ruby/purple depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(274_36%_10%)] via-[hsl(275_48%_20%)] to-[hsl(278_31%_14%)]" />

      {/* Ruby glow accent — top center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(278_55%_45%_/_0.45),transparent_60%)]" />

      {/* Gold luminous accent — bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(41_49%_69%_/_0.18),transparent_55%)]" />

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

      {/* Hairline gold dividers top + bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.4)] to-transparent" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-[hsl(41_49%_69%_/_0.6)] to-transparent" />
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance drop-shadow-[0_2px_20px_hsl(0_0%_0%_/_0.5)]">
          {t("landing.cta_title")}
        </h2>
        <p className="mt-4 md:mt-5 text-sm md:text-base text-foreground/75 max-w-md mx-auto leading-relaxed text-pretty">
          {t("landing.cta_desc")}
        </p>
        <Button
          className="mt-10 md:mt-12 bg-[hsl(41_49%_69%)] text-[hsl(274_36%_8%)] hover:bg-[hsl(41_49%_74%)] font-semibold shadow-[0_8px_32px_hsl(41_49%_69%_/_0.35)] h-12 md:h-13 px-8 md:px-10 rounded-full text-sm md:text-base transition-smooth hover:shadow-[0_12px_40px_hsl(41_49%_69%_/_0.5)] hover:-translate-y-0.5 active:scale-[0.97]"
          asChild
        >
          <Link to="/cadastro?role=professional">
            {t("landing.cta_button")} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
