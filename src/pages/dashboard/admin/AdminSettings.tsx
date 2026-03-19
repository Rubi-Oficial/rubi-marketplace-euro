import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSettings() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_actions")
      .select("*, users!admin_actions_admin_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setActions(data || []);
        setLoading(false);
      });
  }, []);

  const formatAction = (type: string): string => {
    const map: Record<string, string> = {
      profile_approved: "Perfil aprovado",
      profile_rejected: "Perfil rejeitado",
      profile_paused: "Perfil pausado",
      profile_featured: "Perfil destacado",
      profile_unfeatured: "Destaque removido",
      image_approved: "Foto aprovada",
      image_rejected: "Foto rejeitada",
      commission_approved: "Comissão aprovada",
      commission_rejected: "Comissão rejeitada",
      plan_created: "Plano criado",
      plan_updated: "Plano atualizado",
    };
    return map[type] || type;
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Configurações e histórico de ações administrativas.</p>
      </div>

      {/* Admin actions log */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Histórico de Ações</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data/Hora</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : actions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma ação registrada.</td></tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatAction(a.action_type)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.users?.full_name || a.users?.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
