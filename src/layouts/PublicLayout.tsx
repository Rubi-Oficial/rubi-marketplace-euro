import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import PageTransition from "@/components/shared/PageTransition";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import logoVelvetVip from "@/assets/logo-velvet-vip.svg";

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

      <footer className="border-t border-[hsl(0_0%_100%_/_0.08)] py-10 mt-8 bg-[hsl(273_35%_12%_/_0.82)] backdrop-blur-sm" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-5">
            <div>
              <Link to="/" className="inline-block" aria-label="Velvet Escorts VIP — Home">
                <img src={logoVelvetVip} alt="Velvet Escorts VIP" className="h-12 w-auto object-contain" />
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
                <Link to="/buscar" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.explore")}
                </Link>
                <Link to="/planos" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.plans")}
                </Link>
                <Link to="/blog" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.blog")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footer.company")}
              </h4>
              <nav aria-label="Company links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/sobre" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.about")}
                </Link>
                <Link to="/contato" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.contact")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("footer.legal")}
              </h4>
              <nav aria-label="Legal links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/termos" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.terms")}
                </Link>
                <Link to="/privacidade" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.privacy")}
                </Link>
                <Link to="/cookies" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">
                  {t("footer.cookies")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                SEO Local
              </h4>
              <nav aria-label="Local SEO links" className="mt-4 flex flex-col gap-2.5 text-sm">
                <Link to="/es/escorts-barcelona" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Barcelona</Link>
                <Link to="/es/escorts-madrid" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Madrid</Link>
                <Link to="/es/escorts-barcelona/vip" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">VIP Escorts Barcelona</Link>
                <Link to="/es/escorts-madrid/luxury" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Luxury Escorts Madrid</Link>
                <Link to="/br/acompanhantes-florianopolis" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Florianópolis</Link>
                <Link to="/br/acompanhantes-sao-paulo" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">São Paulo</Link>
                <Link to="/br/acompanhantes-sao-paulo/jardins" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Acompanhantes no Jardins</Link>
                <Link to="/br/acompanhantes-florianopolis/jurere-internacional" className="text-secondary-foreground hover:text-primary transition-colors rounded-sm">Acompanhantes em Jurerê Internacional</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t border-[hsl(41_49%_69%_/_0.22)] pt-5 text-center text-xs text-secondary-foreground">
            © {new Date().getFullYear()} Velvet Escorts VIP. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
