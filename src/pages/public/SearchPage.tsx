import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchFilterOptions, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const cityFilter = searchParams.get("cidade") || "";
  const categoryFilter = searchParams.get("categoria") || "";

  useEffect(() => {
    fetchFilterOptions().then(({ cities, categories }) => {
      setCities(cities);
      setCategories(categories);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEligibleProfiles({
      search: searchQuery || undefined,
      city: cityFilter || undefined,
      category: categoryFilter || undefined,
    }).then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, [searchQuery, cityFilter, categoryFilter]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = !!searchQuery || !!cityFilter || !!categoryFilter;

  // SEO
  useEffect(() => {
    const parts = ["Buscar Profissionais"];
    if (cityFilter) parts.push(`em ${cityFilter}`);
    if (categoryFilter) parts.push(`- ${categoryFilter}`);
    document.title = `${parts.join(" ")} | AURA`;
    return () => { document.title = "AURA"; };
  }, [cityFilter, categoryFilter]);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Buscar Profissionais
        </h1>
        <p className="mt-1 text-muted-foreground">
          {loading ? "Carregando..." : `${profiles.length} perfil(is) encontrado(s)`}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "border-primary text-primary" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Filtros</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>

          {cities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Cidade</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateParam("cidade", cityFilter === c ? "" : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      cityFilter === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Categoria</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateParam("categoria", categoryFilter === c ? "" : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      categoryFilter === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {hasFilters
              ? "Nenhum perfil encontrado com os filtros selecionados."
              : "Nenhum perfil disponível no momento."}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
