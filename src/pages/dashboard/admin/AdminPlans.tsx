import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPlans() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .then(({ count }) => setActiveCount(count ?? 0));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Planos</h1>
      <p className="mt-1 text-muted-foreground">Gestão de planos e assinaturas.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Assinaturas ativas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{activeCount}</p>
        </div>
      </div>
    </div>
  );
}
