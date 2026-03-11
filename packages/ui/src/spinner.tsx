"use client";

import * as React from "react";
import { cn } from "@var/shared";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
} as const;

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          "animate-spin rounded-full border-solid border-gray-300 border-t-[var(--color-primary,#0075DB)]",
          sizeMap[size],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
