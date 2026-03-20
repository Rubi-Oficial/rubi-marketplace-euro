import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search, X, SlidersHorizontal, Eye, Pencil, Trash2, ArrowLeft,
  Save, XCircle, Users, Mail, Phone, Calendar, Shield, Clock,
  UserCheck, UserX, ChevronLeft, ChevronRight, Link2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/* ───── Types ───── */
interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: "client" | "professional" | "admin";
  referral_code: string | null;
  referral_link: string | null;
  referred_by_user_id: string | null;
  google_auth_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileBrief {
  id: string;
  display_name: string | null;
  slug: string | null;
  category: string | null;
  status: string;
  city: string | null;
}

interface AdminAction {
  id: string;
  action_type: string;
  notes: string | null;
  created_at: string;
}

const ROLE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  client: { label: "Cliente", variant: "secondary" },
  professional: { label: "Profissional", variant: "default" },
  admin: { label: "Admin", variant: "outline" },
};

const PAGE_SIZES = [10, 25, 50];

/* ───── Component ───── */
export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Detail modal
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserRow>>({});
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<ProfileBrief | null>(null);
  const [userActions, setUserActions] = useState<AdminAction[]>([]);

  /* ───── Fetch users ───── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filterRole !== "all") {
      query = query.eq("role", filterRole as "client" | "professional" | "admin");
    }
    if (searchText.trim()) {
      const term = `%${searchText.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }

    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, count } = await query;
    setUsers((data as UserRow[]) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [page, pageSize, filterRole, searchText]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [searchText, filterRole]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters = searchText || filterRole !== "all";

  const clearFilters = () => {
    setSearchText("");
    setFilterRole("all");
  };

  /* ───── Open detail ───── */
  const openDetail = async (user: UserRow) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setEditing(false);
    setDetailOpen(true);

    // Fetch profile if professional
    if (user.role === "professional") {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, slug, category, status, city")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfile(data as ProfileBrief | null);
    } else {
      setUserProfile(null);
    }

    // Fetch admin actions
    const { data: acts } = await supabase
      .from("admin_actions")
      .select("id, action_type, notes, created_at")
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setUserActions((acts as AdminAction[]) ?? []);
  };

  /* ───── Save edit ───── */
  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);

    const updates: Record<string, unknown> = {};
    if (editForm.full_name !== selectedUser.full_name) updates.full_name = editForm.full_name;
    if (editForm.phone !== selectedUser.phone) updates.phone = editForm.phone;
    if (editForm.role !== selectedUser.role) updates.role = editForm.role;

    if (Object.keys(updates).length === 0) {
      toast.info("Nenhuma alteração detectada.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("users").update(updates).eq("id", selectedUser.id);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // Log action
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
    setSaving(false);
    setEditing(false);
    setSelectedUser({ ...selectedUser, ...updates } as UserRow);
    fetchUsers();
  };

  /* ───── Delete user ───── */
  const handleDelete = async (user: UserRow) => {
    // We can't delete from users table (no DELETE RLS), so we log the intent
    toast.error("Exclusão de usuários não é suportada diretamente. Use o painel do backend para remover contas.");
  };

  /* ───── Format helpers ───── */
  const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const hasChanges = selectedUser && (
    editForm.full_name !== selectedUser.full_name ||
    editForm.phone !== selectedUser.phone ||
    editForm.role !== selectedUser.role
  );

  /* ───── Render ───── */
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" /> Gestão de Usuários
        </h1>
        <p className="mt-1 text-muted-foreground">
          {totalCount} usuário(s) encontrado(s).
        </p>
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
            <Input
              placeholder="Buscar nome ou email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s} por página</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Cadastro</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const roleInfo = ROLE_MAP[u.role] || ROLE_MAP.client;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">
                      <button
                        onClick={() => openDetail(u)}
                        className="hover:text-primary hover:underline transition-colors text-left"
                      >
                        {u.full_name || "—"}
                      </button>
                      {u.google_auth_enabled && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(Google)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {u.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(u)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editing ? "Editar Usuário" : "Detalhes do Usuário"}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                {selectedUser.role === "professional" && (
                  <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
                )}
                <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
              </TabsList>

              {/* ── Info Tab ── */}
              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Actions bar */}
                <div className="flex gap-2 justify-end">
                  {!editing ? (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditForm({ ...selectedUser }); }}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                        <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar
                      </Button>
                    </>
                  )}
                </div>

                {/* Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nome completo</Label>
                    {editing ? (
                      <Input
                        value={editForm.full_name ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="h-9"
                      />
                    ) : (
                      <p className="text-sm font-medium">{selectedUser.full_name || "—"}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedUser.email}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    {editing ? (
                      <Input
                        value={editForm.phone ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-9"
                        placeholder="(XX) XXXXX-XXXX"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedUser.phone || "—"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tipo / Role</Label>
                    {editing ? (
                      <Select
                        value={editForm.role}
                        onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRow["role"] })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={ROLE_MAP[selectedUser.role]?.variant ?? "secondary"}>
                        {ROLE_MAP[selectedUser.role]?.label ?? selectedUser.role}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Data de cadastro</Label>
                    <p className="text-sm flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {fmtDateTime(selectedUser.created_at)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Última atualização</Label>
                    <p className="text-sm flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {fmtDateTime(selectedUser.updated_at)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Login com Google</Label>
                    <p className="text-sm">{selectedUser.google_auth_enabled ? "Sim ✓" : "Não"}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Código de referência</Label>
                    <p className="text-sm flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedUser.referral_code || "—"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">ID do usuário</Label>
                  <p className="text-xs font-mono text-muted-foreground break-all">{selectedUser.id}</p>
                </div>

                {selectedUser.referred_by_user_id && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Referido por</Label>
                    <p className="text-xs font-mono text-muted-foreground break-all">{selectedUser.referred_by_user_id}</p>
                  </div>
                )}
              </TabsContent>

              {/* ── Profile Tab ── */}
              {selectedUser.role === "professional" && (
                <TabsContent value="profile" className="space-y-4 mt-4">
                  {userProfile ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nome do perfil</Label>
                        <p className="text-sm font-medium">{userProfile.display_name || "—"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Slug</Label>
                        <p className="text-sm font-mono">{userProfile.slug || "—"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Categoria</Label>
                        <p className="text-sm">{userProfile.category || "—"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Cidade</Label>
                        <p className="text-sm">{userProfile.city || "—"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Badge variant="outline">{userProfile.status}</Badge>
                      </div>
                      <div className="col-span-full">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/admin/perfis/${userProfile.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver perfil completo
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum perfil profissional encontrado.
                    </p>
                  )}
                </TabsContent>
              )}

              {/* ── History Tab ── */}
              <TabsContent value="history" className="mt-4">
                {userActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma ação registrada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userActions.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">{a.action_type}</p>
                          {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(a.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
