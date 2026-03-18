import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, listings: 0, pending: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([usersRes, listingsRes, pendingRes]) => {
      setStats({
        users: usersRes.count ?? 0,
        listings: listingsRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      });
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Painel Administrativo
      </h1>
      <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total de Usuários</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.users}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total de Anúncios</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.listings}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pendentes de Moderação</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-primary">{stats.pending}</p>
        </div>
      </div>
    </div>
  );
}
