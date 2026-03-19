import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, MailOpen, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

type FilterTab = "all" | "unread" | "read";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    let query = supabase
      .from("contact_messages")
      .select("id, name, email, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "unread") query = query.eq("is_read", false);
    if (filter === "read") query = query.eq("is_read", true);

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar mensagens");
    } else {
      setMessages((data as ContactMessage[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const toggleRead = async (msg: ContactMessage) => {
    const newVal = !msg.is_read;
    setTogglingId(msg.id);

    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: newVal } as any)
      .eq("id", msg.id);

    setTogglingId(null);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, is_read: newVal } : m))
    );
    if (selected?.id === msg.id) {
      setSelected({ ...msg, is_read: newVal });
    }
    toast.success(newVal ? "Marcada como lida" : "Marcada como não lida");
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Mensagens de Contacto</h1>
        <p className="text-sm text-muted-foreground">
          Mensagens recebidas pelo formulário de contacto
          {!loading && unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Não lidas</TabsTrigger>
          <TabsTrigger value="read">Lidas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {filter === "unread"
              ? "Não há mensagens não lidas."
              : filter === "read"
              ? "Não há mensagens lidas."
              : "Nenhuma mensagem recebida ainda."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Mensagem</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="w-16 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={`cursor-pointer transition-colors ${
                    !msg.is_read ? "bg-primary/[0.02]" : ""
                  }`}
                  onClick={() => setSelected(msg)}
                >
                  <TableCell>
                    {msg.is_read ? (
                      <Badge variant="secondary">Lida</Badge>
                    ) : (
                      <Badge variant="default">Nova</Badge>
                    )}
                  </TableCell>
                  <TableCell className={`font-medium ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                    {msg.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {msg.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-sm">
                    {msg.message}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(msg.created_at), "dd/MM/yy HH:mm", { locale: pt })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={togglingId === msg.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(msg);
                      }}
                      title={msg.is_read ? "Marcar como não lida" : "Marcar como lida"}
                    >
                      {msg.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mensagem de {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{selected.email}</span>
                <span>·</span>
                <span>{format(new Date(selected.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}</span>
                {selected.is_read ? (
                  <Badge variant="secondary" className="ml-auto">Lida</Badge>
                ) : (
                  <Badge variant="default" className="ml-auto">Nova</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selected.message}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={togglingId === selected.id}
                  onClick={() => toggleRead(selected)}
                >
                  {selected.is_read ? (
                    <><MailOpen className="mr-2 h-4 w-4" />Marcar como não lida</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" />Marcar como lida</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
