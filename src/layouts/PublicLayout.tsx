import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import PageTransition from "@/components/shared/PageTransition";
import PublicFooter from "@/components/shared/PublicFooter";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
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

      <PublicFooter />
    </div>
  );
}
