import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminReports() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProfiles: 0, totalLeads: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
    ]).then(([u, p, l]) => {
      setStats({
        totalUsers: u.count ?? 0,
        totalProfiles: p.count ?? 0,
        totalLeads: l.count ?? 0,
      });
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
      <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Utilizadores</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.totalUsers}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Perfis</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.totalProfiles}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Leads registados</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.totalLeads}</p>
        </div>
      </div>
    </div>
  );
}
