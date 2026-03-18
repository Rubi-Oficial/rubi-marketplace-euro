import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-foreground">Buscar</h1>
      <p className="mt-2 text-muted-foreground">Encontre profissionais por nome, cidade ou categoria.</p>

      <div className="relative mt-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-10" />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        Use a barra de busca para encontrar perfis.
      </div>
    </div>
  );
}
