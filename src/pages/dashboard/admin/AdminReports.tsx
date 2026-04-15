import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, FileText, Globe } from "lucide-react";

import type { ReportStats, AccessAnalytics, DatePreset, DateRange } from "./reports/types";
import { getDateRange } from "./reports/helpers";
import { DateRangeFilter } from "./reports/DateRangeFilter";
import { OverviewTab } from "./reports/OverviewTab";
import { FinancialTab } from "./reports/FinancialTab";
import { UsersTab } from "./reports/UsersTab";
import { AccessAnalyticsPanel } from "./reports/AccessAnalyticsPanel";

export default function AdminReports() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [accessData, setAccessData] = useState<AccessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const dateRange = useMemo(() => getDateRange(preset, customRange), [preset, customRange]);

  const handlePresetChange = useCallback((p: DatePreset) => {
    setPreset(p);
    if (p !== "custom") setCustomRange({ from: undefined, to: undefined });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { from, to } = dateRange;
        const withDate = (q: any) => {
          let query = q;
          if (from) query = query.gte("created_at", from);
          if (to) query = query.lte("created_at", to);
          return query;
        };

        const [
          usersRes, clientsRes, prosRes, adminsRes,
          profilesRes, approvedRes, pendingRes, rejectedRes,
          leadsRes, subsRes, activeSubsRes, canceledSubsRes,
          allActiveSubsRes, convsRes, recentUsersRes,
        ] = await Promise.all([
          withDate(supabase.from("users").select("id", { count: "exact", head: true })),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client")),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "professional")),
          withDate(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin")),
          withDate(supabase.from("profiles").select("id", { count: "exact", head: true })),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
          withDate(supabase.from("leads").select("id", { count: "exact", head: true })),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true })),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
          withDate(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled")),
          supabase.from("subscriptions").select("plans(price)").eq("status", "active"),
          withDate(supabase.from("referral_conversions").select("commission_amount, status")),
          supabase.from("users").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(10),
        ]);

        const gmv = (allActiveSubsRes.data || []).reduce((s, sub: any) => s + Number(sub.plans?.price || 0), 0);
        const convs = convsRes.data || [];

        setStats({
          totalUsers: usersRes.count ?? 0,
          clientCount: clientsRes.count ?? 0,
          professionalCount: prosRes.count ?? 0,
          adminCount: adminsRes.count ?? 0,
          totalProfiles: profilesRes.count ?? 0,
          approvedProfiles: approvedRes.count ?? 0,
          pendingProfiles: pendingRes.count ?? 0,
          rejectedProfiles: rejectedRes.count ?? 0,
          totalLeads: leadsRes.count ?? 0,
          totalSubs: subsRes.count ?? 0,
          activeSubs: activeSubsRes.count ?? 0,
          canceledSubs: canceledSubsRes.count ?? 0,
          gmv,
          totalConversions: convs.length,
          totalCommissions: convs.reduce((s, c) => s + Number(c.commission_amount), 0),
          paidCommissions: convs.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0),
          pendingCommissions: convs.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0),
          approvedCommissions: convs.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.commission_amount), 0),
          recentUsers: (recentUsersRes.data || []) as any,
        });
      } catch (err) {
        console.error("[AdminReports] Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange]);

  const loadAccessAnalytics = async (force = false) => {
    if (accessData && !force) return;
    setAccessLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_access_analytics");
      if (!error && data) setAccessData(data as unknown as AccessAnalytics);
    } catch { /* silently fail */ }
    setAccessLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Visão consolidada da plataforma.</p>
      </div>

      <Card>
        <CardContent className="p-3">
          <DateRangeFilter preset={preset} range={customRange} onPresetChange={handlePresetChange} onRangeChange={setCustomRange} />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={(v) => { if (v === "access") loadAccessAnalytics(); }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Financeiro</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Cadastros</TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab stats={stats} /></TabsContent>
        <TabsContent value="financial"><FinancialTab stats={stats} /></TabsContent>
        <TabsContent value="users"><UsersTab stats={stats} /></TabsContent>

        <TabsContent value="access" className="space-y-4">
          {accessLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : accessData ? (
            <AccessAnalyticsPanel data={accessData} onRefresh={() => loadAccessAnalytics(true)} refreshing={accessLoading} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum dado de acesso disponível ainda.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
