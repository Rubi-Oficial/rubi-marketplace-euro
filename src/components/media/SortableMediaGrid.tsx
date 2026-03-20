import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { SortableMediaItem, type MediaItem } from "./SortableMediaItem";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface SortableMediaGridProps {
  items: MediaItem[];
  onReorder: (items: MediaItem[]) => void;
  onDelete: (item: MediaItem) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export function SortableMediaGrid({ items, onReorder, onDelete }: SortableMediaGridProps) {
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx }));
    onReorder(updated);
  };

  const handleDragCancel = () => setActiveItem(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <LayoutGroup>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <SortableMediaItem key={item.id} item={item} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </SortableContext>

      {/* Drag overlay — floating preview of the dragged item */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeItem ? (
          <div className="relative overflow-hidden rounded-lg border-2 border-primary bg-card shadow-2xl rotate-2 scale-105">
            <div className="aspect-[3/4] w-full relative bg-muted">
              {activeItem.type === "image" ? (
                <img src={activeItem.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <video src={activeItem.url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
                      <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
              <Badge variant={STATUS_BADGE[activeItem.moderation_status]?.variant ?? "outline"}>
                {STATUS_BADGE[activeItem.moderation_status]?.label ?? "Pendente"}
              </Badge>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
