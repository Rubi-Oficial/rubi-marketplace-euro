import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientAffiliates() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("referral_code")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setReferralCode(data?.referral_code ?? null));

    supabase
      .from("referral_conversions")
      .select("id", { count: "exact", head: true })
      .eq("referrer_user_id", user.id)
      .then(({ count }) => setReferralCount(count ?? 0));
  }, [user]);

  const referralLink = referralCode
    ? `${window.location.origin}/cadastro?ref=${referralCode}`
    : null;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Programa de Afiliados</h1>
      <p className="mt-1 text-muted-foreground">Indique e ganhe comissões.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Seu link de indicação</p>
          <p className="mt-2 break-all text-sm font-mono text-foreground">
            {referralLink ?? "Carregando..."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Conversões realizadas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">
            {referralCount}
          </p>
        </div>
      </div>
    </div>
  );
}
