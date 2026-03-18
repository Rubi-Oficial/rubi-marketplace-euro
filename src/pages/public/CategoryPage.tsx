import { useParams } from "react-router-dom";

export default function CategoryPage() {
  const { slug } = useParams();

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-foreground capitalize">
        {slug?.replace(/-/g, " ")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Profissionais nesta categoria.
      </p>
      <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        Nenhum perfil encontrado nesta categoria.
      </div>
    </div>
  );
}
