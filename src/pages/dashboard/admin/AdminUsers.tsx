import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Pause, Star, StarOff, Eye, Search, X, SlidersHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  city: string | null;
  category: string | null;
  gender: string | null;
  slug: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  bio: string | null;
  age: number | null;
  whatsapp: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles((data as ProfileRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  // Derive unique filter options from loaded data
  const cities = useMemo(() => {
    const set = new Set(profiles.map((p) => p.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [profiles]);

  const categories = useMemo(() => {
    const set = new Set(profiles.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [profiles]);

  const genders = useMemo(() => {
    const set = new Set(profiles.map((p) => p.gender).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [profiles]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (searchName && !(p.display_name ?? "").toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterCity !== "all" && p.city !== filterCity) return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterGender !== "all" && p.gender !== filterGender) return false;
      if (filterFeatured === "yes" && !p.is_featured) return false;
      if (filterFeatured === "no" && p.is_featured) return false;
      return true;
    });
  }, [profiles, searchName, filterStatus, filterCity, filterCategory, filterGender, filterFeatured]);

  const hasActiveFilters = searchName || filterStatus !== "all" || filterCity !== "all" || filterCategory !== "all" || filterGender !== "all" || filterFeatured !== "all";

  const clearFilters = () => {
    setSearchName("");
    setFilterStatus("all");
    setFilterCity("all");
    setFilterCategory("all");
    setFilterGender("all");
    setFilterFeatured("all");
  };

  const logAction = async (actionType: string, profileId: string, userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: actionType,
        target_profile_id: profileId,
        target_user_id: userId,
      });
    }
  };

  const updateStatus = async (profile: ProfileRow, status: "approved" | "rejected" | "paused" | "draft" | "pending_review") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    await logAction(`profile_${status}`, profile.id, profile.user_id);
    toast.success(`Status alterado para ${STATUS_MAP[status]?.label || status}.`);
    fetchProfiles();
  };

  const toggleFeatured = async (profile: ProfileRow) => {
    const newVal = !profile.is_featured;
    const { error } = await supabase.from("profiles").update({ is_featured: newVal }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    await logAction(newVal ? "profile_featured" : "profile_unfeatured", profile.id, profile.user_id);
    toast.success(newVal ? "Perfil destacado!" : "Destaque removido.");
    fetchProfiles();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Perfis</h1>
        <p className="mt-1 text-muted-foreground">
          {filtered.length} de {profiles.length} perfil(is).
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Search name */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="pending_review">Em análise</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
            </SelectContent>
          </Select>

          {/* City */}
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Gender */}
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gêneros</SelectItem>
              {genders.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Featured */}
          <Select value={filterFeatured} onValueChange={setFilterFeatured}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Destaque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Destacados</SelectItem>
              <SelectItem value="no">Não destacados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gênero</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Destaque</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum perfil encontrado.</td></tr>
            ) : (
              filtered.map((p) => {
                const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">
                      <a href={`/admin/perfis/${p.id}`} className="hover:text-primary hover:underline transition-colors font-medium">
                        {p.display_name || "—"}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.city || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.gender || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleFeatured(p)} className="text-muted-foreground hover:text-primary transition-colors">
                        {p.is_featured ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mx-auto" /> : <StarOff className="h-4 w-4 mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/admin/perfis/${p.id}`}><Eye className="h-4 w-4" /></a>
                        </Button>
                        {p.status !== "approved" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => updateStatus(p, "approved")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status !== "rejected" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus(p, "rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status === "approved" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500" onClick={() => updateStatus(p, "paused")}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
