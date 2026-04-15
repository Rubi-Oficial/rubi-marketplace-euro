import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import BrandLogo from "@/components/shared/BrandLogo";

function FooterColumn({ title, ariaLabel, children }: { title: string; ariaLabel: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
        {title}
      </h4>
      <nav aria-label={ariaLabel} className="flex flex-col gap-2.5 text-sm">
        {children}
      </nav>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-secondary-foreground/70 hover:text-primary transition-colors duration-200 rounded-sm w-fit focus-visible:ring-2 focus-visible:ring-primary/40 hover:translate-x-0.5 transform transition-transform"
    >
      {children}
    </Link>
  );
}

export default function PublicFooter() {
  const { t } = useLanguage();

  return (
    <footer
      className="relative border-t border-border/20 py-16 mt-12 overflow-hidden"
      role="contentinfo"
    >
      <div className="absolute inset-0 bg-[hsl(273_35%_9%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(278_31%_51%_/_0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(41_49%_69%_/_0.03),transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="inline-block transition-opacity hover:opacity-80" aria-label="Velvet Escorts VIP — Home">
              <BrandLogo imgClassName="h-10" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground/70 leading-relaxed max-w-[220px]">
              {t("footer.desc")}
            </p>
          </div>

          <FooterColumn title={t("footer.platform")} ariaLabel="Platform links">
            <FooterLink to="/buscar">{t("footer.explore")}</FooterLink>
            <FooterLink to="/planos">{t("footer.plans")}</FooterLink>
            <FooterLink to="/blog">{t("footer.blog")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("footer.company")} ariaLabel="Company links">
            <FooterLink to="/sobre">{t("footer.about")}</FooterLink>
            <FooterLink to="/contato">{t("footer.contact")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("footer.legal")} ariaLabel="Legal links">
            <FooterLink to="/termos">{t("footer.terms")}</FooterLink>
            <FooterLink to="/privacidade">{t("footer.privacy")}</FooterLink>
            <FooterLink to="/cookies">{t("footer.cookies")}</FooterLink>
          </FooterColumn>

          <FooterColumn title="SEO Local" ariaLabel="Local SEO links">
            <FooterLink to="/es/escorts-barcelona">Barcelona</FooterLink>
            <FooterLink to="/es/escorts-madrid">Madrid</FooterLink>
            <FooterLink to="/es/escorts-paris">Paris</FooterLink>
            <FooterLink to="/es/escorts-lisbon">Lisbon</FooterLink>
            <FooterLink to="/es/escorts-milan">Milan</FooterLink>
            <FooterLink to="/es/escorts-marbella">Marbella</FooterLink>
            <FooterLink to="/es/escorts-barcelona/vip">VIP Barcelona</FooterLink>
            <FooterLink to="/es/escorts-paris/jantar">Jantar Paris</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-14 pt-6 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} Velvet Escorts VIP. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
            <span className="text-[11px] text-muted-foreground/50">
              {t("footer.secure") || "Secure & encrypted"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
