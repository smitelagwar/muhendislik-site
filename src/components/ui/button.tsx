import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-zinc-950 hover:bg-amber-400",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-zinc-200 bg-white/90 text-zinc-900 hover:border-amber-500/45 hover:bg-amber-50 dark:border-border dark:bg-background dark:text-foreground dark:hover:border-amber-400/40 dark:hover:bg-amber-500/10",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-foreground dark:hover:bg-zinc-700",
        ghost: "text-zinc-700 hover:bg-amber-50 hover:text-amber-700 dark:text-zinc-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-200",
        link: "text-amber-700 underline-offset-4 hover:underline dark:text-amber-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 rounded-md px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-sm",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
