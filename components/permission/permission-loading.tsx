"use client";

import { LoadingIndicator } from "@/components/ui/loading-indicator";

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
  if (variant === "spinner") {
    return (
      <LoadingIndicator
        variant="spinner"
        size={size === "md" ? "default" : size}
        message={message}
        className={className}
      />
    );
  }

  if (variant === "minimal") {
    return (
      <LoadingIndicator
        variant="minimal"
        size={size}
        message={message}
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingIndicator
        variant="form"
        fields={1}
        className={size === "sm" ? "h-8 w-24" : size === "md" ? "h-10 w-32" : "h-12 w-40"}
      />
      {message && (
        <span className="text-xs text-muted-foreground animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
}
