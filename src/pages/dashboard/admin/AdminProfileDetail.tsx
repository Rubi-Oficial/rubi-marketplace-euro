import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Pause, Play } from "lucide-react";

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  city: string | null;
  city_slug: string | null;
  country: string | null;
  category: string | null;
  bio: string | null;
  age: number | null;
  slug: string | null;
  status: string;
  is_featured: boolean;
  pricing_from: number | null;
  languages: string[] | null;
  whatsapp: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileImage {
  id: string;
  storage_path: string;
  moderation_status: string;
  sort_order: number;
  url: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Under review", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  paused: { label: "Paused", variant: "secondary" },
};

export default function AdminProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);

    const [{ data: profileData }, { data: imgData }, { data: psData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id!).single(),
      supabase.from("profile_images").select("*").eq("profile_id", id!).order("sort_order", { ascending: true }),
      supabase.from("profile_services").select("service_id, services!inner(name)").eq("profile_id", id!),
    ]);

    if (profileData) setProfile(profileData as any);

    if (imgData) {
      setImages(imgData.map((img: any) => ({
        ...img,
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
      })));
    }

    if (psData) {
      setServices(psData.map((r: any) => r.services?.name || "Unknown"));
    }

    setLoading(false);
  };

  const handleAction = async (newStatus: string) => {
    if (!profile) return;
    setActing(true);

    const { error } = await supabase.from("profiles").update({ status: newStatus as any }).eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      setActing(false);
      return;
    }

    // Log admin action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: `profile_${newStatus}`,
        target_profile_id: profile.id,
        target_user_id: profile.user_id,
        notes: note.trim() || null,
      });
    }

    toast.success(`Status changed to ${STATUS_MAP[newStatus]?.label || newStatus}.`);
    setNote("");
    setActing(false);
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/perfis")}>
          Back to profiles
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP.draft;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/perfis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {profile.display_name || "Untitled Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(profile.created_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Photos</h2>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                <img src={img.url} alt="Profile photo" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute bottom-1 right-1">
                  <Badge
                    variant={img.moderation_status === "approved" ? "default" : img.moderation_status === "rejected" ? "destructive" : "outline"}
                    className="text-[10px]"
                  >
                    {img.moderation_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Name" value={profile.display_name} />
            <Detail label="Age" value={profile.age?.toString()} />
            <Detail label="City" value={profile.city} />
            <Detail label="City Slug" value={(profile as any).city_slug} />
            <Detail label="Country" value={profile.country} />
            <Detail label="Category" value={profile.category} />
            <Detail label="Slug" value={profile.slug} />
            <Detail label="Price from" value={profile.pricing_from ? `€${profile.pricing_from}` : null} />
            <Detail label="Languages" value={profile.languages?.join(", ")} />
            <Detail label="Featured" value={profile.is_featured ? "Yes" : "No"} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contact & Services</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="WhatsApp" value={profile.whatsapp} />
            <Detail label="Telegram" value={profile.telegram} />
          </div>
          {services.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">Bio</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Actions</h2>
        <div className="space-y-3">
          <Textarea
            placeholder="Internal note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex flex-wrap gap-3">
            {profile.status !== "approved" && (
              <Button onClick={() => handleAction("approved")} disabled={acting}>
                <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            )}
            {profile.status !== "rejected" && (
              <Button variant="destructive" onClick={() => handleAction("rejected")} disabled={acting}>
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            )}
            {profile.status === "approved" && (
              <Button variant="outline" onClick={() => handleAction("paused")} disabled={acting}>
                <Pause className="mr-1.5 h-4 w-4" /> Pause
              </Button>
            )}
            {profile.status === "paused" && (
              <Button variant="outline" onClick={() => handleAction("approved")} disabled={acting}>
                <Play className="mr-1.5 h-4 w-4" /> Reactivate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-foreground text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
