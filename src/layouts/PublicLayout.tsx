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

      <footer className="border-t border-[hsl(0_0%_100%_/_0.06)] py-12 mt-10 bg-[hsl(273_35%_10%_/_0.9)] backdrop-blur-sm" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-1">
              <Link to="/" className="inline-block" aria-label="Velvet Escorts VIP — Home">
                <BrandLogo imgClassName="h-10" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed max-w-[220px]">
                {t("footer.desc")}
              </p>
            </div>
            <div>
              <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
                {t("footer.platform")}
              </h4>
              <nav aria-label="Platform links" className="flex flex-col gap-2.5 text-sm">
                <Link to="/buscar" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.explore")}
                </Link>
                <Link to="/planos" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.plans")}
                </Link>
                <Link to="/blog" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.blog")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
                {t("footer.company")}
              </h4>
              <nav aria-label="Company links" className="flex flex-col gap-2.5 text-sm">
                <Link to="/sobre" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.about")}
                </Link>
                <Link to="/contato" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.contact")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
                {t("footer.legal")}
              </h4>
              <nav aria-label="Legal links" className="flex flex-col gap-2.5 text-sm">
                <Link to="/termos" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.terms")}
                </Link>
                <Link to="/privacidade" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.privacy")}
                </Link>
                <Link to="/cookies" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">
                  {t("footer.cookies")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-4">
                SEO Local
              </h4>
              <nav aria-label="Local SEO links" className="flex flex-col gap-2.5 text-[13px]">
                <Link to="/es/escorts-barcelona" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">Barcelona</Link>
                <Link to="/es/escorts-madrid" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">Madrid</Link>
                <Link to="/es/escorts-barcelona/vip" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">VIP Escorts Barcelona</Link>
                <Link to="/es/escorts-madrid/luxury" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">Luxury Escorts Madrid</Link>
                <Link to="/br/acompanhantes-florianopolis" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">Florianópolis</Link>
                <Link to="/br/acompanhantes-sao-paulo" className="text-secondary-foreground hover:text-primary transition-colors duration-200 rounded-sm w-fit">São Paulo</Link>
              </nav>
            </div>
          </div>
          <div className="mt-10 pt-6 text-center">
            <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <p className="text-xs text-secondary-foreground/60">
              © {new Date().getFullYear()} Velvet Escorts VIP. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
