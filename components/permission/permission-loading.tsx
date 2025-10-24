"use client";

import { Loader2, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

  /**
   * Children to show skeleton for (optional)
   */
  children?: ReactNode;
}

/**
 * Permission Loading Component
 *
 * Shows loading state while permission checks are being performed.
 *
 * @example
 * // Simple spinner
 * <PermissionLoading variant="spinner" />
 *
 * @example
 * // Skeleton loader
 * <PermissionLoading variant="skeleton" size="lg" />
 *
 * @example
 * // Minimal loader with custom message
 * <PermissionLoading variant="minimal" message="Checking permissions..." />
 */
export function PermissionLoading({
  variant = "skeleton",
  message,
  size = "md",
  className = "",
}: PermissionLoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-24",
    md: "h-10 w-32",
    lg: "h-12 w-40",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "spinner") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2
          className={`${iconSizes[size]} animate-spin text-muted-foreground`}
        />
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 opacity-50 ${className}`}>
        <Shield className={`${iconSizes[size]} text-muted-foreground`} />
        {message && (
          <span className="text-xs text-muted-foreground">{message}</span>
        )}
      </div>
    );
  }

  // Skeleton variant (default)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Skeleton className={sizeClasses[size]} />
      {message && (
        <span className="text-xs text-muted-foreground animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
}
