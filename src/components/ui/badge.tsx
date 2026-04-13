import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        featured: "border-[hsl(41_49%_69%_/_0.32)] bg-[hsl(41_49%_69%_/_0.2)] text-primary",
        premium: "border-[hsl(278_31%_51%_/_0.4)] bg-[hsl(278_31%_51%_/_0.24)] text-foreground",
        exclusive: "border-[hsl(41_49%_69%_/_0.3)] bg-gradient-to-r from-[hsl(41_49%_69%_/_0.2)] to-[hsl(278_31%_51%_/_0.25)] text-foreground",
        outline: "border-border/80 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
