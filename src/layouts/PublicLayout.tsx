import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import PageTransition from "@/components/shared/PageTransition";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import BrandLogo from "@/components/shared/BrandLogo";

export default function PublicLayout() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip-to-content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Navbar />

      <div className="pt-[6.5rem]">
        <main id="main-content" tabIndex={-1}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <footer
        className="border-t border-border/30 py-14 mt-10 bg-[hsl(273_35%_10%_/_0.9)] backdrop-blur-sm"
        role="contentinfo"
      >
        <div className="container mx-auto px-4">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
            <div className="sm:col-span-2 md:col-span-1">
              <Link to="/" className="inline-block" aria-label="Velvet Escorts VIP — Home">
                <BrandLogo imgClassName="h-10" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed max-w-[220px]">
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

          <div className="mt-12 pt-6 text-center">
            <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <p className="text-xs text-secondary-foreground/50">
              © {new Date().getFullYear()} Velvet Escorts VIP. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
      className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {children}
    </Link>
  );
}
