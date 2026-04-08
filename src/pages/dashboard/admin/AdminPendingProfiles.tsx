import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSignedUrls } from "@/lib/storageUrls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendingProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  city: string | null;
  category: string | null;
  bio: string | null;
  age: number | null;
  slug: string | null;
  created_at: string;
  status: string;
}

interface PendingImage {
  id: string;
  profile_id: string;
  storage_path: string;
  moderation_status: string;
  sort_order: number;
  url: string;
  profile_name?: string;
}

export default function AdminPendingProfiles() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [tab, setTab] = useState("profiles");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: profileData, error: profErr }, { data: imgData, error: imgErr }] = await Promise.all([
        supabase.from("profiles").select("*")
          .eq("status", "pending_review").order("created_at", { ascending: false }),
        supabase.from("profile_images").select("*, profiles!inner(display_name)")
          .eq("moderation_status", "pending").order("created_at", { ascending: false }),
      ]);

      if (profErr) console.error("[AdminPendingProfiles] Profiles error:", profErr.message);
      if (imgErr) console.error("[AdminPendingProfiles] Images error:", imgErr.message);

      setProfiles((profileData as PendingProfile[]) ?? []);
      const imgPaths = (imgData ?? []).map((img: any) => img.storage_path);
      const imgUrls = await getSignedUrls(imgPaths);
      setPendingImages((imgData ?? []).map((img: any) => ({
        ...img,
        url: imgUrls[img.storage_path] || "",
        profile_name: img.profiles?.display_name || "—",
      })));
    } catch (err) {
      console.error("[AdminPendingProfiles] Unexpected error:", err);
      toast.error("Erro ao carregar dados de moderação. Tente recarregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProfileAction = async (profile: PendingProfile, action: "approved" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ status: action }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }

    // Log admin action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: `profile_${action}`,
        target_profile_id: profile.id,
        target_user_id: profile.user_id,
      });
    }

    toast.success(action === "approved" ? "Perfil aprovado!" : "Perfil rejeitado.");
    setSelectedProfile(null);
    fetchData();
  };

  const handleImageAction = async (img: PendingImage, action: "approved" | "rejected") => {
    const { error } = await supabase.from("profile_images")
      .update({ moderation_status: action }).eq("id", img.id);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "approved" ? "Foto aprovada!" : "Foto rejeitada.");
    fetchData();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Moderação</h1>
      <p className="mt-1 text-muted-foreground">
        {profiles.length} perfil(is) e {pendingImages.length} foto(s) pendentes.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="profiles">
            Perfis ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="photos">
            Fotos ({pendingImages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </td></tr>
                  ))
                ) : profiles.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum perfil pendente.
                  </td></tr>
                ) : (
                  profiles.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{p.display_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.city || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setSelectedProfile(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400"
                            onClick={() => handleProfileAction(p, "approved")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => handleProfileAction(p, "rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          {pendingImages.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
              Nenhuma foto pendente.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingImages.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="aspect-[3/4]">
                    <img src={img.url} alt="Foto pendente" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-xs text-muted-foreground truncate">{img.profile_name}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400"
                        onClick={() => handleImageAction(img, "approved")}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => handleImageAction(img, "rejected")}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Profile detail dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProfile?.display_name || "Perfil"}</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Cidade:</span> <span className="text-foreground ml-1">{selectedProfile.city || "—"}</span></div>
                <div><span className="text-muted-foreground">Categoria:</span> <span className="text-foreground ml-1">{selectedProfile.category || "—"}</span></div>
                <div><span className="text-muted-foreground">Idade:</span> <span className="text-foreground ml-1">{selectedProfile.age || "—"}</span></div>
                <div><span className="text-muted-foreground">Slug:</span> <span className="text-foreground ml-1">{selectedProfile.slug || "—"}</span></div>
              </div>
              {selectedProfile.bio && (
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedProfile.bio}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => handleProfileAction(selectedProfile, "approved")}>
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Aprovar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleProfileAction(selectedProfile, "rejected")}>
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
