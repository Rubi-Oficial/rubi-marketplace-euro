import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserData {
  full_name: string | null;
  created_at: string;
  referral_code: string | null;
  referral_link: string | null;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("full_name, created_at, referral_code, referral_link")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setUserData(data));
  }, [user]);

  const referralUrl = userData?.referral_link
    ? `${window.location.origin}${userData.referral_link}`
    : null;

  const copyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    toast.success("Link copiado!");
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Bem-vindo, {userData?.full_name || "Cliente"}
      </h1>
      <p className="mt-1 text-muted-foreground">Seu painel de cliente</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Conta desde</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
            {userData?.created_at
              ? new Date(userData.created_at).toLocaleDateString("pt-BR")
              : "—"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Seu link de afiliado</p>
          </div>
          {referralUrl ? (
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs text-foreground">
                {referralUrl}
              </code>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Carregando...</p>
          )}
        </div>
      </div>
    </div>
  );
}
