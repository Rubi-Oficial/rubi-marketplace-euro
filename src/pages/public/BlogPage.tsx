import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useEffect } from "react";

const posts = [
  {
    slug: "como-criar-perfil-profissional",
    title: "Como criar um perfil profissional de sucesso",
    excerpt: "Dicas essenciais para montar um anúncio que converte: fotos, descrição e preços.",
    date: "2026-03-15",
  },
  {
    slug: "seguranca-online-profissionais",
    title: "Segurança online para profissionais independentes",
    excerpt: "Boas práticas para proteger sua identidade e privacidade na internet.",
    date: "2026-03-10",
  },
  {
    slug: "programa-afiliados-como-funciona",
    title: "Programa de Afiliados: como funciona?",
    excerpt: "Entenda como indicar profissionais e ganhar comissões recorrentes na AURA.",
    date: "2026-03-05",
  },
];

export default function BlogPage() {
  useEffect(() => {
    document.title = "Blog — Dicas e Novidades | AURA";
    return () => { document.title = "AURA"; };
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Blog</h1>
        <p className="mt-2 text-muted-foreground">Dicas, novidades e guias para profissionais.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-lg border border-border bg-card p-6 flex flex-col transition-colors hover:border-primary/30"
          >
            <h2 className="font-display text-lg font-semibold text-foreground leading-snug">
              {post.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString("pt-BR")}
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 mx-auto max-w-xl text-center rounded-lg border border-primary/20 bg-primary/5 p-8">
        <h2 className="font-display text-xl font-bold text-foreground">Quer anunciar na AURA?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie seu perfil verificado e comece a receber clientes hoje.
        </p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">Começar Agora</Link>
        </Button>
      </div>
    </div>
  );
}
