import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-[background-color,border-color,color,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border border-amber-500 bg-amber-500 text-[#17120a] hover:border-amber-400 hover:bg-amber-400",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-border bg-card text-foreground hover:border-blue-500/50 hover:bg-secondary",
        secondary: "border border-border bg-secondary text-secondary-foreground hover:border-amber-500/40 hover:bg-card",
        ghost: "text-foreground hover:bg-secondary hover:text-amber-700 dark:hover:text-amber-300",
        link: "min-h-0 text-blue-700 underline-offset-4 hover:underline dark:text-blue-300",
      },
      size: {
        default: "px-4 py-2",
        xs: "min-h-8 px-2 text-xs",
        sm: "min-h-10 px-3 text-sm",
        lg: "min-h-12 px-6",
        icon: "size-11 min-h-11",
        "icon-xs": "size-8 min-h-8",
        "icon-sm": "size-10 min-h-10",
        "icon-lg": "size-12 min-h-12",
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
