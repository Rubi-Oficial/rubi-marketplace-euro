import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import PageTransition from "@/components/shared/PageTransition";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import logoRubiGirls from "@/assets/logo-rubi-girls.png";

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

      <footer className="border-t-2 border-border py-10 mt-8 bg-secondary/40" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <Link to="/" className="inline-block" aria-label="Rubi Girls — Home">
                <img src={logoRubiGirls} alt="Rubi Girls" className="h-6" />
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t("footer.desc")}
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footer.platform")}
              </h4>
              <nav aria-label="Platform links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/buscar" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.explore")}
                </Link>
                <Link to="/planos" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.plans")}
                </Link>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.blog")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footer.company")}
              </h4>
              <nav aria-label="Company links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/sobre" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.about")}
                </Link>
                <Link to="/contato" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.contact")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footer.legal")}
              </h4>
              <nav aria-label="Legal links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.terms")}
                </Link>
                <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.privacy")}
                </Link>
                <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors rounded-sm">
                  {t("footer.cookies")}
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t border-border/20 pt-5 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rubi Girls. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
