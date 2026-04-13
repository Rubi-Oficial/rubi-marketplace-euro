import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, X, SlidersHorizontal, Users } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserTable, type UserRow } from "@/components/admin/UserTable";
import { UserDetailDialog, type ProfileBrief, type AdminAction } from "@/components/admin/UserDetailDialog";

const PAGE_SIZES = [10, 25, 50];

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Detail modal state
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<ProfileBrief | null>(null);
  const [userActions, setUserActions] = useState<AdminAction[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filterRole !== "all") {
        query = query.eq("role", filterRole as UserRow["role"]);
      }
      if (searchText.trim()) {
        const term = `%${searchText.trim()}%`;
        query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
      }
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, count, error } = await query;
      if (error) {
        console.error("[AdminUserManagement] Fetch error:", error.message);
        toast.error("Não foi possível carregar os usuários.");
        return;
      }
      setUsers((data as UserRow[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("[AdminUserManagement] Unexpected error:", err);
      toast.error("Ocorreu um erro inesperado ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterRole, searchText]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(0); }, [searchText, filterRole]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters = searchText || filterRole !== "all";
  const clearFilters = () => { setSearchText(""); setFilterRole("all"); };

  const openDetail = async (user: UserRow) => {
    setSelectedUser(user);
    setDetailOpen(true);

    try {
      if (user.role === "professional") {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, slug, category, status, city")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) console.error("[AdminUserManagement] Profile detail error:", error.message);
        setUserProfile(data as ProfileBrief | null);
      } else {
        setUserProfile(null);
      }

      const { data: acts, error: actsError } = await supabase
        .from("admin_actions")
        .select("id, action_type, notes, created_at")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (actsError) console.error("[AdminUserManagement] Actions error:", actsError.message);
      setUserActions((acts as AdminAction[]) ?? []);
    } catch (err) {
      console.error("[AdminUserManagement] Unexpected detail error:", err);
      toast.error("Não foi possível carregar os detalhes do usuário.");
    }
  };

  const handleSave = async (updates: Partial<UserRow>) => {
    if (!selectedUser) return;
    if (Object.keys(updates).length === 0) {
      toast.info("Nenhuma alteração detectada.");
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase.from("users").update(updates).eq("id", selectedUser.id);
      if (error) {
        console.error("[AdminUserManagement] Save error:", error.message);
        toast.error("Não foi possível salvar as alterações. Tente novamente.");
        return;
      }

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (adminUser) {
        await supabase.from("admin_actions").insert({
          admin_user_id: adminUser.id,
          action_type: "user_edited",
          target_user_id: selectedUser.id,
          notes: `Campos alterados: ${Object.keys(updates).join(", ")}`,
        });
      }

      toast.success("Usuário atualizado com sucesso.");
      setSelectedUser({ ...selectedUser, ...updates } as UserRow);
      fetchUsers();
    } catch (err) {
      console.error("[AdminUserManagement] Unexpected save error:", err);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" /> Gestão de Usuários
        </h1>
        <p className="mt-1 text-muted-foreground">{totalCount} usuário(s) encontrado(s).</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar nome ou email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s} por página</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <UserTable
        users={users}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onOpenDetail={openDetail}
      />

      <UserDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        user={selectedUser}
        userProfile={userProfile}
        userActions={userActions}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
