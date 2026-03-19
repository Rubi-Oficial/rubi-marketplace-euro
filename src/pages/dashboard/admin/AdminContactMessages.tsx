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
import { Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: newVal } as any)
      .eq("id", msg.id);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Mensagens de Contacto</h1>
        <p className="text-sm text-muted-foreground">Mensagens recebidas pelo formulário de contacto</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Não lidas</TabsTrigger>
          <TabsTrigger value="read">Lidas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhuma mensagem encontrada.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow
                  key={msg.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(msg)}
                >
                  <TableCell>
                    {msg.is_read ? (
                      <Badge variant="secondary">Lida</Badge>
                    ) : (
                      <Badge variant="default">Nova</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell className="text-muted-foreground">{msg.email}</TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell text-muted-foreground">
                    {msg.message}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(msg.created_at), "dd/MM/yy HH:mm", { locale: pt })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selected.email}</span>
                <span>·</span>
                <span>{format(new Date(selected.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selected.message}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
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
