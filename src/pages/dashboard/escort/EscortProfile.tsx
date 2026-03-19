import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Send, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CITIES, CATEGORIES, type ServiceOption } from "@/components/onboarding/types";

interface ProfileForm {
  display_name: string;
  age: string;
  city: string;
  city_slug: string;
  country: string;
  category: string;
  bio: string;
  languages: string;
  pricing_from: string;
  whatsapp: string;
  telegram: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Under review", variant: "outline" },
  approved: { label: "Approved — awaiting activation", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  paused: { label: "Paused", variant: "secondary" },
};

export default function EscortProfile() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState<ProfileForm>({
    display_name: "", age: "", city: "", city_slug: "", country: "",
    category: "", bio: "", languages: "English",
    pricing_from: "", whatsapp: "", telegram: "",
  });

  useEffect(() => {
    if (!user) return;

    // Load services from DB
    supabase.from("services").select("id, name, slug").eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => { if (data) setServices(data as ServiceOption[]); });

    // Check active subscription
    supabase.from("subscriptions").select("id").eq("user_id", user.id).eq("status", "active").limit(1)
      .then(({ data }) => setHasActiveSub((data?.length ?? 0) > 0));

    // Load profile
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setProfileId(data.id);
          setStatus(data.status);
          setSlug(data.slug);
          setForm({
            display_name: data.display_name || "",
            age: data.age?.toString() || "",
            city: data.city || "",
            city_slug: (data as any).city_slug || "",
            country: data.country || "",
            category: data.category || "",
            bio: data.bio || "",
            languages: data.languages?.join(", ") || "English",
            pricing_from: data.pricing_from?.toString() || "",
            whatsapp: data.whatsapp || "",
            telegram: data.telegram || "",
          });
          const { data: ps } = await supabase.from("profile_services")
            .select("service_id").eq("profile_id", data.id);
          if (ps) setSelectedServices(ps.map((r: any) => r.service_id));
        }
        setLoading(false);
      });
  }, [user]);

  const update = (field: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectCity = (name: string, slug: string) => {
    update("city", name);
    update("city_slug", slug);
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (submitForReview = false) => {
    if (!user || !profileId) return;
    setSaving(true);

    const newSlug = generateSlug(form.display_name);
    const payload: any = {
      display_name: form.display_name.trim(),
      age: form.age ? parseInt(form.age) : null,
      city: form.city || null,
      city_slug: form.city_slug || null,
      country: form.country || null,
      category: form.category || null,
      bio: form.bio.trim() || null,
      languages: form.languages ? form.languages.split(",").map((l) => l.trim()).filter(Boolean) : null,
      pricing_from: form.pricing_from ? parseFloat(form.pricing_from) : null,
      whatsapp: form.whatsapp.trim() || null,
      telegram: form.telegram.trim() || null,
      slug: newSlug || null,
      ...(submitForReview ? { status: "pending_review" as const } : {}),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", profileId);

    // Save services
    if (!error) {
      await supabase.from("profile_services").delete().eq("profile_id", profileId);
      if (selectedServices.length > 0) {
        await supabase.from("profile_services").insert(
          selectedServices.map((sid) => ({ profile_id: profileId, service_id: sid }))
        );
      }
    }

    setSaving(false);

    if (error) {
      toast.error("Error saving: " + error.message);
      return;
    }

    if (submitForReview) {
      setStatus("pending_review");
      toast.success("Profile submitted for review!");
    } else {
      setSlug(newSlug);
      toast.success("Changes saved!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">No profile found.</p>
        <Button asChild className="mt-4"><Link to="/app/onboarding">Create profile</Link></Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const isPublished = status === "approved" && hasActiveSub;
  const canSubmit = form.display_name.trim().length >= 2 && form.city && form.category;
  const canEdit = status !== "pending_review";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Edit your listing and information.</p>
        </div>
        <div className="flex items-center gap-3">
          {isPublished ? (
            <Badge variant="default" className="bg-green-600">Published</Badge>
          ) : (
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          )}
          {isPublished && slug && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/perfil/${slug}`} target="_blank">
                <Eye className="mr-1.5 h-4 w-4" /> View public
              </Link>
            </Button>
          )}
        </div>
      </div>

      {status === "rejected" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            Your profile was rejected. Please correct the information and resubmit.
          </p>
        </div>
      )}

      {status === "approved" && !hasActiveSub && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            Your profile is approved! <Link to="/app/plano" className="underline font-medium">Activate your subscription</Link> to go live.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Basic info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Basic details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display name *</Label>
              <Input id="display_name" value={form.display_name} disabled={!canEdit}
                onChange={(e) => update("display_name", e.target.value)} maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={18} max={99} value={form.age} disabled={!canEdit}
                onChange={(e) => update("age", e.target.value)} />
            </div>
          </div>
        </div>

        {/* City & Category */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">City & category</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c.slug} type="button" disabled={!canEdit}
                    onClick={() => selectCity(c.name, c.slug)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                      form.city_slug === c.slug
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" disabled={!canEdit}
                    onClick={() => update("category", c)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                      form.category === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Services</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                    !canEdit && "opacity-50 pointer-events-none",
                    selectedServices.includes(s.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Checkbox
                    checked={selectedServices.includes(s.id)}
                    onCheckedChange={() => toggleService(s.id)}
                    disabled={!canEdit}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">About you</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={5} maxLength={1000} value={form.bio} disabled={!canEdit}
                onChange={(e) => update("bio", e.target.value)} placeholder="Describe yourself..." />
              <p className="text-xs text-muted-foreground">{form.bio.length}/1000</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="languages">Languages</Label>
                <Input id="languages" value={form.languages} disabled={!canEdit}
                  onChange={(e) => update("languages", e.target.value)} placeholder="English, Dutch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing_from">Starting price (€)</Label>
                <Input id="pricing_from" type="number" min={0} value={form.pricing_from} disabled={!canEdit}
                  onChange={(e) => update("pricing_from", e.target.value)} placeholder="200" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} disabled={!canEdit}
                onChange={(e) => update("whatsapp", e.target.value)} placeholder="+31 6 12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input id="telegram" value={form.telegram} disabled={!canEdit}
                onChange={(e) => update("telegram", e.target.value)} placeholder="@youruser" />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-3">
            <Button onClick={() => handleSave(false)} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
            {(status === "draft" || status === "rejected") && canSubmit && (
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                <Send className="mr-1.5 h-4 w-4" /> Submit for review
              </Button>
            )}
          </div>
        )}
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            Your profile is under review and cannot be edited at this time.
          </p>
        )}
      </div>
    </div>
  );
}
