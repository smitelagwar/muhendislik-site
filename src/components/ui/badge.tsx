import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
