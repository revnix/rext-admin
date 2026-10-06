"use client";

import { Loader2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PermissionLoadingProps {
  /**
   * Loading variant
   */
  variant?: "skeleton" | "spinner" | "minimal";

  /**
   * Custom loading message
   */
  message?: string;

  /**
   * Size of the loading indicator
   */
  size?: "sm" | "md" | "lg";

  /**
   * Custom className
   */
  className?: string;
}

export function PermissionLoading({
  variant = "skeleton",
  message,
  size = "md",
  className = "",
}: PermissionLoadingProps) {
  const label = message ? (
    <span className="text-xs text-muted-foreground">{message}</span>
  ) : null;

  if (variant === "spinner") {
    return (
      <div
        role="status"
        className={cn("flex flex-col items-center gap-3", className)}
      >
        <Loader2
          className={cn(
            "animate-spin text-foreground",
            size === "sm" ? "size-3" : size === "md" ? "size-4" : "size-8",
          )}
          aria-hidden
        />
        {label ?? <span className="sr-only">Checking permissions</span>}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2 opacity-50", className)}>
        <Shield
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "size-3" : size === "md" ? "size-4" : "size-5",
          )}
          aria-hidden
        />
        {label}
      </div>
    );
  }

  // The shape of the button or control the guard is holding back.
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton
        className={
          size === "sm" ? "h-8 w-24" : size === "md" ? "h-10 w-32" : "h-12 w-40"
        }
      />
      {label}
    </div>
  );
}
