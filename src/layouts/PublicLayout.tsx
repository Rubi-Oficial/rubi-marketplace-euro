import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import { Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[6.5rem]">
        <main>
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border/50 py-10 mt-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <span className="font-display text-lg tracking-tight text-foreground">
                <span className="font-bold text-primary">Rubi</span>
                <span className="font-medium text-foreground/80"> Girls</span>
              </span>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Premium catalogue for independent professionals across Europe.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/buscar" className="hover:text-foreground transition-colors">Explore</Link>
                <Link to="/planos" className="hover:text-foreground transition-colors">Plans</Link>
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/sobre" className="hover:text-foreground transition-colors">About</Link>
                <Link to="/contato" className="hover:text-foreground transition-colors">Contact</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/termos" className="hover:text-foreground transition-colors">Terms</Link>
                <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t border-border/20 pt-5 text-center text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Rubi Girls. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}