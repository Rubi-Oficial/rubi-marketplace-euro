import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: any;
  is_active: boolean;
  created_at: string;
  tier?: string | null;
  is_boost?: boolean | null;
  highlight_days?: number | null;
  stripe_price_id?: string | null;
}

interface PlanForm {
  name: string;
  price: string;
  billing_period: "monthly" | "quarterly";
  features: string;
  tier: string;
  is_boost: boolean;
  highlight_days: string;
  stripe_price_id: string;
}

const EMPTY_FORM: PlanForm = {
  name: "",
  price: "",
  billing_period: "monthly",
  features: "",
  tier: "standard",
  is_boost: false,
  highlight_days: "30",
  stripe_price_id: "",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

const TIER_COLORS: Record<string, string> = {
  exclusive: "text-yellow-600",
  premium: "text-purple-600",
  standard: "text-muted-foreground",
};

export default function AdminPlans() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubs, setActiveSubs] = useState(0);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PlanForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.from("plans").select("*").order("price", { ascending: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    setPlans((data as Plan[]) ?? []);
    setActiveSubs(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price.toString(),
      billing_period: plan.billing_period as "monthly" | "quarterly",
      features: Array.isArray(plan.features_json) ? plan.features_json.join("\n") : "",
      tier: plan.tier ?? "standard",
      is_boost: plan.is_boost ?? false,
      highlight_days: (plan.highlight_days ?? 30).toString(),
      stripe_price_id: plan.stripe_price_id ?? "",
    });
  };

  const logAction = async (actionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({ admin_user_id: user.id, action_type: actionType });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error(t("admin_plans.fill_fields")); return; }
    setSaving(true);
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      billing_period: form.billing_period,
      features_json: features,
      tier: form.tier,
      is_boost: form.is_boost,
      highlight_days: parseInt(form.highlight_days) || 30,
      stripe_price_id: form.stripe_price_id || null,
    };

    if (editPlan) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editPlan.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAction("plan_updated");
      toast.success(t("admin_plans.updated"));
    } else {
      const { error } = await supabase.from("plans").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAction("plan_created");
      toast.success(t("admin_plans.created"));
    }
    setSaving(false);
    setEditPlan(null);
    setShowCreate(false);
    setForm({ ...EMPTY_FORM });
    fetchPlans();
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase.from("plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
    if (error) { toast.error(error.message); return; }
    toast.success(plan.is_active ? t("admin_plans.deactivated") : t("admin_plans.activated"));
    fetchPlans();
  };

  const dialogOpen = !!editPlan || showCreate;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("admin_plans.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("admin_plans.active_subs", { count: String(activeSubs) })}</p>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(true); setForm({ ...EMPTY_FORM }); }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("admin_plans.new_plan")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-muted" />)
        ) : plans.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">{t("admin_plans.no_plans")}</p>
        ) : (
          plans.map((plan) => {
            const tierColor = TIER_COLORS[plan.tier ?? "standard"] ?? "text-muted-foreground";
            return (
              <div key={plan.id} className={`rounded-lg border bg-card p-5 space-y-3 ${plan.is_active ? "border-border" : "border-border opacity-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                    {plan.is_boost && <Zap className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.tier && plan.tier !== "standard" && (
                      <Badge variant="outline" className={tierColor}>
                        {plan.tier}
                      </Badge>
                    )}
                    <Badge variant={plan.is_active ? "default" : "secondary"}>{plan.is_active ? t("admin_plans.active") : t("admin_plans.inactive")}</Badge>
                  </div>
                </div>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground">{fmt(plan.price)}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {plan.is_boost ? "Pagamento único" : plan.billing_period === "monthly" ? t("admin_plans.monthly") : t("admin_plans.quarterly")}
                  {plan.highlight_days ? ` · ${plan.highlight_days} dias` : ""}
                </p>
                {plan.stripe_price_id && (
                  <p className="text-xs text-muted-foreground/60 truncate">Stripe: {plan.stripe_price_id}</p>
                )}
                {Array.isArray(plan.features_json) && plan.features_json.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {plan.features_json.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                  </ul>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                    <Pencil className="mr-1 h-3 w-3" /> {t("admin_plans.edit")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(plan)}>
                    {plan.is_active ? t("admin_plans.deactivate") : t("admin_plans.activate")}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setEditPlan(null); setShowCreate(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPlan ? t("admin_plans.edit_title") : t("admin_plans.new_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("admin_plans.name_label")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin_plans.price_label")}</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>

            {/* Tier */}
            <div className="space-y-1.5">
              <Label>Tier de destaque</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>

            {/* Is Boost */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_boost"
                checked={form.is_boost}
                onChange={(e) => setForm({ ...form, is_boost: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_boost">É um Boost (pagamento único)</Label>
            </div>

            {/* Billing period - only show if not boost */}
            {!form.is_boost && (
              <div className="space-y-1.5">
                <Label>{t("admin_plans.period_label")}</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.billing_period}
                  onChange={(e) => setForm({ ...form, billing_period: e.target.value as "monthly" | "quarterly" })}
                >
                  <option value="monthly">{t("admin_plans.monthly")}</option>
                  <option value="quarterly">{t("admin_plans.quarterly")}</option>
                </select>
              </div>
            )}

            {/* Highlight days */}
            <div className="space-y-1.5">
              <Label>Dias de destaque</Label>
              <Input type="number" min="1" value={form.highlight_days} onChange={(e) => setForm({ ...form, highlight_days: e.target.value })} />
            </div>

            {/* Stripe Price ID */}
            <div className="space-y-1.5">
              <Label>Stripe Price ID <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                value={form.stripe_price_id}
                onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
                placeholder="price_..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin_plans.features_label")}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>{saving ? t("admin_plans.saving") : t("admin_plans.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
