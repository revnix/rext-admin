import type * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  success?: boolean;
}

function Input({ className, type, error, success, ...props }: InputProps) {
  return (
    <div className="relative w-full group">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground block h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-base transition-colors duration-200 outline-none text-ellipsis file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70 md:text-sm",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          error && "border-destructive focus-visible:ring-destructive/20",
          success &&
            "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
          className,
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm font-normal text-destructive animate-in slide-in-from-top-1 fade-in-0">
          {error}
        </p>
      )}
    </div>
  );
}

export { Input };
