export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">Blog</h1>
      <p className="mt-2 text-muted-foreground">Artigos e novidades da AURA.</p>

      <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        Em breve novos artigos.
      </div>
    </div>
  );
}
