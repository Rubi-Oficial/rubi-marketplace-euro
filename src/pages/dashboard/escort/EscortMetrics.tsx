import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Send, Eye } from "lucide-react";

export default function EscortMetrics() {
  const { user } = useAuth();
  const [profileViews, setProfileViews] = useState(0);
  const [whatsappCard, setWhatsappCard] = useState(0);
  const [whatsappProfile, setWhatsappProfile] = useState(0);
  const [telegramProfile, setTelegramProfile] = useState(0);
  const [approvedImages, setApprovedImages] = useState(0);
  const [pendingImages, setPendingImages] = useState(0);
  const [rejectedImages, setRejectedImages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadMetrics = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles").select("id, status").eq("user_id", user.id).maybeSingle();
        
        if (profileError) {
          console.error("[EscortMetrics] Profile fetch error:", profileError.message);
          return;
        }
        if (!profile) return;

        const pid = profile.id;
        const [viewsRes, waCardRes, waProfileRes, tgRes, imgsRes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", pid).eq("source", "profile_view"),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", pid).eq("source", "whatsapp_card"),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", pid).eq("source", "whatsapp_profile"),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("profile_id", pid).eq("source", "telegram_profile"),
          supabase.from("profile_images").select("moderation_status").eq("profile_id", pid),
        ]);

        setProfileViews(viewsRes.count ?? 0);
        setWhatsappCard(waCardRes.count ?? 0);
        setWhatsappProfile(waProfileRes.count ?? 0);
        setTelegramProfile(tgRes.count ?? 0);
        if (imgsRes.data) {
          setApprovedImages(imgsRes.data.filter((i: any) => i.moderation_status === "approved").length);
          setPendingImages(imgsRes.data.filter((i: any) => i.moderation_status === "pending").length);
          setRejectedImages(imgsRes.data.filter((i: any) => i.moderation_status === "rejected").length);
        }
      } catch (err) {
        console.error("[EscortMetrics] Unexpected error:", err);
      }
    };

    loadMetrics();
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Métricas</h1>
      <p className="mt-1 text-muted-foreground">Desempenho do seu perfil.</p>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">Visitas e contatos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <p className="text-sm">Visitas ao perfil</p>
              </div>
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{profileViews}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm">WhatsApp (card)</p>
              </div>
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{whatsappCard}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm">WhatsApp (perfil)</p>
              </div>
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{whatsappProfile}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Send className="h-4 w-4" />
                <p className="text-sm">Telegram (perfil)</p>
              </div>
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{telegramProfile}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">Fotos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Fotos aprovadas</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{approvedImages}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Fotos pendentes</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{pendingImages}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Fotos rejeitadas</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{rejectedImages}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
