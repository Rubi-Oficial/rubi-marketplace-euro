import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  UserPlus,
  CreditCard,
  TrendingUp,
} from "lucide-react";

interface ReferredUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface AffiliateRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  referral_code: string | null;
  referral_link: string | null;
  clicks: number;
  signups: number;
  conversions: number;
  commissionPending: number;
  commissionApproved: number;
  commissionPaid: number;
  commissionTotal: number;
  referredUsers: ReferredUser[];
}

interface ConversionRow {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
  conversion_type: string;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "commissions" | "referrals">("overview");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);

    // 1. All users with referral codes
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, role, referral_code, referral_link")
      .not("referral_code", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!users || users.length === 0) {
      setAffiliates([]);
      setConversions([]);
      setLoading(false);
      return;
    }

    const userIds = users.map((u) => u.id);

    // 2. Parallel batch queries
    const [clicksRes, referredUsersRes, conversionsAllRes] = await Promise.all([
      supabase.from("referral_clicks").select("referrer_user_id").in("referrer_user_id", userIds),
      supabase.from("users").select("id, full_name, email, role, referred_by_user_id, created_at").in("referred_by_user_id", userIds).order("created_at", { ascending: false }),
      supabase.from("referral_conversions").select("*").in("referrer_user_id", userIds).order("created_at", { ascending: false }),
    ]);

    // Aggregate clicks per referrer
    const clicksByUser = new Map<string, number>();
    for (const c of clicksRes.data || []) {
      clicksByUser.set(c.referrer_user_id, (clicksByUser.get(c.referrer_user_id) || 0) + 1);
    }

    // Aggregate referred users per referrer
    const referredByUser = new Map<string, ReferredUser[]>();
    for (const u of referredUsersRes.data || []) {
      const rid = u.referred_by_user_id!;
      if (!referredByUser.has(rid)) referredByUser.set(rid, []);
      referredByUser.get(rid)!.push({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
      });
    }

    // Aggregate conversions per referrer
    const convsByUser = new Map<string, typeof conversionsAllRes.data>();
    for (const c of conversionsAllRes.data || []) {
      if (!convsByUser.has(c.referrer_user_id)) convsByUser.set(c.referrer_user_id, []);
      convsByUser.get(c.referrer_user_id)!.push(c);
    }

    // Build rows
    const rows: AffiliateRow[] = users.map((u) => {
      const convs = convsByUser.get(u.id) || [];
      const commissionPending = convs.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);
      const commissionApproved = convs.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.commission_amount), 0);
      const commissionPaid = convs.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0);

      return {
        ...u,
        clicks: clicksByUser.get(u.id) || 0,
        signups: referredByUser.get(u.id)?.length || 0,
        conversions: convs.filter((c) => c.status !== "rejected").length,
        commissionPending,
        commissionApproved,
        commissionPaid,
        commissionTotal: commissionPending + commissionApproved + commissionPaid,
        referredUsers: referredByUser.get(u.id) || [],
      };
    });

    // Sort by total commission desc, then by signups
    rows.sort((a, b) => b.commissionTotal - a.commissionTotal || b.signups - a.signups);
    setAffiliates(rows);

    // Build conversions with names
    const allUserMap = new Map<string, { full_name: string | null; email: string }>();
    for (const u of users) allUserMap.set(u.id, { full_name: u.full_name, email: u.email });
    for (const u of referredUsersRes.data || []) allUserMap.set(u.id, { full_name: u.full_name, email: u.email });

    setConversions(
      (conversionsAllRes.data || []).map((c: any) => {
        const referrer = allUserMap.get(c.referrer_user_id);
        const referred = allUserMap.get(c.referred_user_id);
        return {
          id: c.id,
          referrer_name: referrer?.full_name || "—",
          referrer_email: referrer?.email || "",
          referred_name: referred?.full_name || "—",
          referred_email: referred?.email || "",
          conversion_type: c.conversion_type,
          commission_amount: c.commission_amount,
          commission_rate: c.commission_rate,
          status: c.status,
          created_at: c.created_at,
        };
      })
    );

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateConversionStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("referral_conversions").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: `commission_${status}`,
      });
    }

    toast.success(status === "approved" ? "Comissão aprovada!" : "Comissão rejeitada.");
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  // Summary stats
  const totalClicks = affiliates.reduce((s, a) => s + a.clicks, 0);
  const totalSignups = affiliates.reduce((s, a) => s + a.signups, 0);
  const totalConversions = affiliates.reduce((s, a) => s + a.conversions, 0);
  const totalCommission = affiliates.reduce((s, a) => s + a.commissionTotal, 0);
  const pendingConversions = conversions.filter((c) => c.status === "pending").length;

  const statusLabel: Record<string, string> = { pending: "Pendente", approved: "Aprovada", paid: "Paga", rejected: "Rejeitada" };
  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    approved: "bg-primary/10 text-primary",
    paid: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
  };
  const roleLabel: Record<string, string> = { client: "Cliente", professional: "Profissional", admin: "Admin" };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Afiliados</h1>
        <p className="mt-1 text-muted-foreground">
          {affiliates.length} afiliado(s) · {pendingConversions} comissão(ões) pendente(s)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<MousePointerClick className="h-4 w-4" />} label="Total de Cliques" value={totalClicks.toString()} />
        <SummaryCard icon={<UserPlus className="h-4 w-4" />} label="Cadastros Gerados" value={totalSignups.toString()} />
        <SummaryCard icon={<CreditCard className="h-4 w-4" />} label="Conversões" value={totalConversions.toString()} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Comissão Total" value={fmt(totalCommission)} highlight />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "commissions", "referrals"] as const).map((t) => {
          const labels = { overview: "Afiliados", commissions: `Comissões (${conversions.length})`, referrals: "Indicações" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Afiliado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cliques</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cadastros</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Conversões</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pendente</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aprovada</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Paga</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {affiliates.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Nenhum afiliado registado.</td></tr>
              ) : (
                affiliates.map((a) => (
                  <>
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{a.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.referral_code}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{roleLabel[a.role] || a.role}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.signups}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.conversions}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(a.commissionPending)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-primary">{fmt(a.commissionApproved)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">{fmt(a.commissionPaid)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">{fmt(a.commissionTotal)}</td>
                      <td className="px-4 py-3">
                        {a.referredUsers.length > 0 && (
                          <button
                            onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedId === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === a.id && a.referredUsers.length > 0 && (
                      <tr key={`${a.id}-details`}>
                        <td colSpan={11} className="bg-muted/20 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Utilizadores indicados por {a.full_name || a.email} ({a.referredUsers.length})
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {a.referredUsers.map((ru) => (
                              <div key={ru.id} className="rounded-md border border-border bg-card px-3 py-2">
                                <p className="text-sm font-medium text-foreground">{ru.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{ru.email}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="capitalize">{roleLabel[ru.role] || ru.role}</span>
                                  <span>·</span>
                                  <span>{new Date(ru.created_at).toLocaleDateString("pt-BR")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Commissions */}
      {tab === "commissions" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Afiliado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Taxa</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {conversions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhuma comissão registada.</td></tr>
              ) : (
                conversions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{c.referrer_name}</p>
                      <p className="text-xs text-muted-foreground">{c.referrer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{c.referred_name}</p>
                      <p className="text-xs text-muted-foreground">{c.referred_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {c.conversion_type === "subscription" ? "Assinatura" : c.conversion_type}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {(Number(c.commission_rate) * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{fmt(c.commission_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] || ""}`}>
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "pending" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => updateConversionStatus(c.id, "approved")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateConversionStatus(c.id, "rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Referrals (all referred users) */}
      {tab === "referrals" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicado por</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allReferred = affiliates.flatMap((a) =>
                  a.referredUsers.map((ru) => ({ ...ru, referrerName: a.full_name || a.email }))
                );
                allReferred.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                if (allReferred.length === 0) {
                  return <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma indicação registada.</td></tr>;
                }

                return allReferred.map((ru) => (
                  <tr key={ru.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{ru.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{ru.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{roleLabel[ru.role] || ru.role}</td>
                    <td className="px-4 py-3 text-foreground">{ru.referrerName}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{new Date(ru.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-5 ${highlight ? "border-primary/30" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
