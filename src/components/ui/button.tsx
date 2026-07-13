import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Black Hawk SOC-OS Button — Editorial Premium
 *
 * Calm by default. No glow. No gradient.
 * Primary = solid brand. Secondary = bordered. Ghost = text-only.
 * Reserved variants `glass` / `glassAccent` kept (used by landing) but cleaned up.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-soft",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-soft",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-2 hover:border-primary/40",
        secondary:
          "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
        ghost:
          "text-foreground hover:bg-surface-2",
        link:
          "text-primary underline-offset-4 hover:underline",
        // Editorial / landing only
        glass:
          "bg-card/60 backdrop-blur-xl border border-border text-foreground hover:bg-card hover:border-primary/40",
        glassAccent:
          "bg-primary/15 backdrop-blur-xl border border-primary/40 text-primary hover:bg-primary/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        xl: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
