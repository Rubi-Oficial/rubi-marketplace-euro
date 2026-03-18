import { useParams } from "react-router-dom";

export default function ProfilePage() {
  const { slug } = useParams();

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="rounded-lg border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold text-foreground capitalize">
          {slug?.replace(/-/g, " ")}
        </h1>
        <p className="mt-2 text-muted-foreground">Perfil profissional.</p>
      </div>
    </div>
  );
}
