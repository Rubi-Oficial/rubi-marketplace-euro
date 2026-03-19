import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Página não encontrada | AURA";
    return () => { document.title = "AURA"; };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          Página não encontrada
        </h1>
        <p className="mt-2 text-muted-foreground">
          O endereço que procura não existe ou foi removido.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
