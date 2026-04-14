import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      onClick={scrollUp}
      aria-label="Voltar ao topo"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full",
        "bg-primary/90 text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)_/_0.3)]",
        "backdrop-blur-sm border border-primary/20",
        "transition-all duration-300 ease-out",
        "hover:bg-primary hover:shadow-[0_8px_28px_hsl(var(--primary)_/_0.4)] hover:-translate-y-0.5",
        "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-95",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp className="h-4.5 w-4.5" />
    </button>
  );
}
