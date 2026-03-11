"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@var/shared";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary,#0075DB)] text-white shadow-sm hover:bg-[var(--color-primary-dark,#005fad)] focus-visible:ring-[var(--color-primary,#0075DB)]",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:ring-gray-500",
        outline:
          "border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-500",
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600",
        link: "text-[var(--color-primary,#0075DB)] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        sm: "h-9 px-3 text-xs rounded-md",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, the component merges its props onto its immediate child instead of rendering a <button>. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
