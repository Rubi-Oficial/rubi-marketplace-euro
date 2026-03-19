import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import { Plus, Pencil } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features_json: any;
  is_active: boolean;
  created_at: string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubs, setActiveSubs] = useState(0);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", billing_period: "monthly" as "monthly" | "quarterly", features: "" });
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
      billing_period: plan.billing_period,
      features: Array.isArray(plan.features_json) ? plan.features_json.join("\n") : "",
    });
  };

  const logAction = async (actionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({ admin_user_id: user.id, action_type: actionType });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Preencha nome e preço."); return; }
    setSaving(true);
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      billing_period: form.billing_period,
      features_json: features,
    };

    if (editPlan) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editPlan.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAction("plan_updated");
      toast.success("Plano atualizado!");
    } else {
      const { error } = await supabase.from("plans").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAction("plan_created");
      toast.success("Plano criado!");
    }
    setSaving(false);
    setEditPlan(null);
    setShowCreate(false);
    setForm({ name: "", price: "", billing_period: "monthly", features: "" });
    fetchPlans();
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase.from("plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
    if (error) { toast.error(error.message); return; }
    toast.success(plan.is_active ? "Plano desativado." : "Plano ativado.");
    fetchPlans();
  };

  const dialogOpen = !!editPlan || showCreate;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Planos</h1>
          <p className="mt-1 text-muted-foreground">{activeSubs} assinatura(s) ativa(s).</p>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(true); setForm({ name: "", price: "", billing_period: "monthly" as "monthly" | "quarterly", features: "" }); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo plano
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-muted" />)
        ) : plans.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">Nenhum plano cadastrado.</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className={`rounded-lg border bg-card p-5 space-y-3 ${plan.is_active ? "border-border" : "border-border opacity-50"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                <Badge variant={plan.is_active ? "default" : "secondary"}>{plan.is_active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">{fmt(plan.price)}</p>
              <p className="text-xs text-muted-foreground capitalize">{plan.billing_period === "monthly" ? "Mensal" : "Trimestral"}</p>
              {Array.isArray(plan.features_json) && plan.features_json.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {plan.features_json.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                </ul>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                  <Pencil className="mr-1 h-3 w-3" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(plan)}>
                  {plan.is_active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setEditPlan(null); setShowCreate(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.billing_period}
                onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Features (uma por linha)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
