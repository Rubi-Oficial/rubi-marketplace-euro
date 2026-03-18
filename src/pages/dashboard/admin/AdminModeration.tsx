import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string; email?: string } | null;
}

export default function AdminModeration() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*, profiles(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, status: "published" | "archived") => {
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(status === "published" ? "Anúncio aprovado" : "Anúncio rejeitado");
      fetchPending();
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">Moderação</h1>
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Moderação</h1>
      <p className="mt-1 text-muted-foreground">
        {listings.length} anúncio(s) pendente(s) de aprovação.
      </p>

      <div className="mt-8 space-y-3">
        {listings.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            Nenhum anúncio pendente.
          </div>
        ) : (
          listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-foreground">{listing.title}</p>
                <p className="text-sm text-muted-foreground">
                  por {listing.profiles?.full_name || "Anônimo"} •{" "}
                  {new Date(listing.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-500 hover:text-green-400"
                  onClick={() => handleAction(listing.id, "published")}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive/80"
                  onClick={() => handleAction(listing.id, "archived")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
