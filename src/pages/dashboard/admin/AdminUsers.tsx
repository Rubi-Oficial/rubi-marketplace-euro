import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Pause, Star, StarOff, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  city: string | null;
  category: string | null;
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
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data } = await query;
    setProfiles((data as ProfileRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [filter]);

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
    setSelected(null);
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

  const filters = [
    { value: "all", label: "Todos" },
    { value: "approved", label: "Aprovados" },
    { value: "pending_review", label: "Pendentes" },
    { value: "draft", label: "Rascunho" },
    { value: "rejected", label: "Rejeitados" },
    { value: "paused", label: "Pausados" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Perfis</h1>
        <p className="mt-1 text-muted-foreground">{profiles.length} perfil(is) encontrado(s).</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Destaque</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
              ))
            ) : profiles.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum perfil encontrado.</td></tr>
            ) : (
              profiles.map((p) => {
                const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                     <td className="px-4 py-3 text-foreground">
                       <a href={`/admin/perfis/${p.id}`} className="hover:text-primary hover:underline transition-colors">{p.display_name || "—"}</a>
                     </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.city || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(p)}>
                          <Eye className="h-4 w-4" />
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.display_name || "Perfil"}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Cidade" value={selected.city} />
                <Detail label="Categoria" value={selected.category} />
                <Detail label="Idade" value={selected.age?.toString()} />
                <Detail label="Slug" value={selected.slug} />
                <Detail label="WhatsApp" value={selected.whatsapp} />
                <Detail label="Status" value={STATUS_MAP[selected.status]?.label || selected.status} />
              </div>
              {selected.bio && (
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-foreground whitespace-pre-wrap">{selected.bio}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => updateStatus(selected, "approved")}>
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Aprovar
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => updateStatus(selected, "paused")}>
                  <Pause className="mr-1.5 h-4 w-4" /> Pausar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => updateStatus(selected, "rejected")}>
                  <XCircle className="mr-1.5 h-4 w-4" /> Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground ml-1">{value || "—"}</span>
    </div>
  );
}
