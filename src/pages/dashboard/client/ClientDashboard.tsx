import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<{ full_name: string | null; created_at: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("full_name, created_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setUserData(data));
  }, [user]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Bem-vindo, {userData?.full_name || "Cliente"}
      </h1>
      <p className="mt-1 text-muted-foreground">Seu painel de cliente</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <StatCard label="Conta desde" value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString("pt-BR") : "—"} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
