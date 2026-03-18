export default function ClientFavorites() {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Favoritos</h1>
      <p className="mt-1 text-muted-foreground">Seus perfis favoritos aparecerão aqui.</p>
      <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        Nenhum favorito ainda.
      </div>
    </div>
  );
}
