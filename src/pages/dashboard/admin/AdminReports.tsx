import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminReports() {
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, totalEvents: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("analytics_events").select("id", { count: "exact", head: true }),
    ]).then(([u, l, e]) => {
      setStats({
        totalUsers: u.count ?? 0,
        totalListings: l.count ?? 0,
        totalEvents: e.count ?? 0,
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
          <p className="text-sm text-muted-foreground">Anúncios</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.totalListings}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Eventos registados</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{stats.totalEvents}</p>
        </div>
      </div>
    </div>
  );
}
