import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import { Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <span className="font-display text-lg font-bold text-primary">AURA</span>
              <p className="mt-2 text-sm text-muted-foreground">
                Plataforma premium para profissionais independentes na Europa.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">Plataforma</h4>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/buscar" className="hover:text-foreground transition-colors">Buscar</Link>
                <Link to="/planos" className="hover:text-foreground transition-colors">Planos</Link>
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">Empresa</h4>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/sobre" className="hover:text-foreground transition-colors">Sobre</Link>
                <Link to="/contato" className="hover:text-foreground transition-colors">Contacto</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">Legal</h4>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
                <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
                <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} AURA. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
