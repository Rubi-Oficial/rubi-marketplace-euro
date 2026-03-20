import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, GripVertical } from "lucide-react";

export interface MediaItem {
  id: string;
  storage_path: string;
  moderation_status: "pending" | "approved" | "rejected";
  sort_order: number;
  url: string;
  type: "image" | "video";
  duration_seconds?: number;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

interface SortableMediaItemProps {
  item: MediaItem;
  onDelete: (item: MediaItem) => void;
}

export function SortableMediaItem({ item, onDelete }: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const badge = STATUS_BADGE[item.moderation_status] || STATUS_BADGE.pending;

  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:text-foreground group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="aspect-[3/4] w-full relative bg-muted">
        {item.type === "image" ? (
          <img src={item.url} alt="Foto do perfil" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <>
            <video src={item.url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
