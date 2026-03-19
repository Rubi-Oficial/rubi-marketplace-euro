import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ArrowLeft } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryName = slug?.replace(/-/g, " ") || "";

  useEffect(() => {
    if (!categoryName) return;
    setLoading(true);
    fetchEligibleProfiles({ category: categoryName }).then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, [categoryName]);

  useEffect(() => {
    document.title = `${categoryName} — Profissionais | AURA`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `Encontre profissionais da categoria ${categoryName}. Perfis verificados com fotos e contato direto.`);
    return () => { document.title = "AURA"; };
  }, [categoryName]);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <Link to="/buscar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à busca
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground capitalize sm:text-3xl">
          {categoryName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {loading ? "Carregando..." : `${profiles.length} profissional(is)`}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nenhum perfil encontrado nesta categoria.</p>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/buscar">Ver todos os perfis</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      <div className="mt-16 mx-auto max-w-xl text-center rounded-lg border border-primary/20 bg-primary/5 p-8">
        <h2 className="font-display text-xl font-bold text-foreground">É profissional?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Anuncie na AURA e alcance milhares de clientes.</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">Anunciar Agora</Link>
        </Button>
      </div>
    </div>
  );
}
