import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Black Hawk SOC-OS Badge — Editorial Premium
 *
 * Pill-shaped, low-contrast tinted background, hairline border.
 * Status variants map directly to semantic alert tokens.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/10 text-primary",
        secondary:
          "border-border bg-surface-2 text-text-muted",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline:
          "border-border text-foreground bg-transparent",
        // Semantic
        normal:
          "border-[hsl(var(--alert-normal)/0.3)] bg-[hsl(var(--alert-normal)/0.1)] text-[hsl(var(--alert-normal))]",
        caution:
          "border-[hsl(var(--alert-caution)/0.3)] bg-[hsl(var(--alert-caution)/0.1)] text-[hsl(var(--alert-caution))]",
        critical:
          "border-[hsl(var(--alert-critical)/0.3)] bg-[hsl(var(--alert-critical)/0.1)] text-[hsl(var(--alert-critical))]",
        info:
          "border-[hsl(var(--alert-info)/0.3)] bg-[hsl(var(--alert-info)/0.1)] text-[hsl(var(--alert-info))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
