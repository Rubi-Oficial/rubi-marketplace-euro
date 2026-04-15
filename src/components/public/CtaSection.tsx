import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export function CtaSection() {
  const { t } = useLanguage();

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 ruby-gradient opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(41_49%_69%_/_0.12),transparent_60%)]" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
          {t("landing.cta_title")}
        </h2>
        <p className="mt-4 md:mt-5 text-sm md:text-base text-foreground/70 max-w-md mx-auto leading-relaxed text-pretty">
          {t("landing.cta_desc")}
        </p>
        <Button
          className="mt-10 md:mt-12 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-[0_8px_32px_hsl(0_0%_0%_/_0.25)] h-12 md:h-13 px-8 md:px-10 rounded-full text-sm md:text-base transition-smooth hover:shadow-[0_12px_40px_hsl(0_0%_0%_/_0.35)] hover:-translate-y-0.5 active:scale-[0.97]"
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
