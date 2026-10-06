"use client";

import { Loader2, Check, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LoadingStep } from "@/constants/loading-steps";

type SpinnerVariant = {
  variant: "spinner";
  message?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
};

type StepsVariant = {
  variant: "steps";
  steps: LoadingStep[];
  activeStepIndex: number;
  completedStepIds?: string[];
  className?: string;
};

type TableVariant = {
  variant: "table";
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  className?: string;
};

type CardVariant = {
  variant: "card";
  className?: string;
};

type FormVariant = {
  variant: "form";
  fields?: number;
  className?: string;
};

type MinimalVariant = {
  variant: "minimal";
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

type LoadingIndicatorProps =
  | SpinnerVariant
  | StepsVariant
  | TableVariant
  | CardVariant
  | FormVariant
  | MinimalVariant;

export function LoadingIndicator(props: LoadingIndicatorProps) {
  if (props.variant === "spinner") {
    const sizeClass = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-8 w-8",
    }[props.size ?? "default"];

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          props.className,
        )}
      >
        <Loader2
          className={cn(sizeClass, "animate-spin text-foreground")}
          aria-hidden="true"
        />
        {props.message ? (
          <p className="text-sm text-muted-foreground">{props.message}</p>
        ) : null}
      </div>
    );
  }

  if (props.variant === "table") {
    const rows = props.rows ?? 5;
    const columns = props.columns ?? 6;
    const showHeader = props.showHeader ?? true;
    const showFilters = props.showFilters ?? false;
    const showPagination = props.showPagination ?? false;
    const columnKeys = Array.from(
      { length: columns },
      (_, index) => `column-${index}`,
    );
    const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index}`);

    return (
      <div className={cn("space-y-4", props.className)}>
        {showFilters && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        )}

        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {showHeader && (
              <div
                className="grid gap-4 pb-2 border-b"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {columnKeys.map((columnKey) => (
                  <Skeleton key={`header-${columnKey}`} className="h-4" />
                ))}
              </div>
            )}

            {rowKeys.map((rowKey) => (
              <div
                key={rowKey}
                className="grid gap-4 py-3"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {columnKeys.map((columnKey, colIndex) => (
                  <div key={`${rowKey}-${columnKey}`}>
                    {colIndex === 0 ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ) : (
                      <Skeleton
                        className={cn(
                          "h-4 w-full",
                          colIndex % 3 === 0 ? "rounded-full" : "",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {showPagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <Skeleton className="h-4 w-[200px]" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-8 w-[80px]" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (props.variant === "card") {
    return (
      <Card
        className={cn("w-full", props.className)}
        aria-label="Loading card content"
      >
        <Skeleton className="h-6 w-1/3 m-4" />
        <Skeleton className="h-32 w-[calc(100%-2rem)] m-4" />
      </Card>
    );
  }

  if (props.variant === "form") {
    const fields = props.fields ?? 3;
    return (
      <div className={cn("space-y-6", props.className)}>
        {Array.from({ length: fields }, (_, i) => i).map((index) => (
          <div key={`field-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-3 mt-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (props.variant === "minimal") {
    const iconSizeClass = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }[props.size ?? "md"];

    return (
      <div
        className={cn("flex items-center gap-2 opacity-50", props.className)}
      >
        <Shield className={cn(iconSizeClass, "text-muted-foreground")} />
        {props.message && (
          <span className="text-xs text-muted-foreground">{props.message}</span>
        )}
      </div>
    );
  }

  if (props.variant === "steps") {
    return (
      <div
        className={cn(
          "w-full border border-border rounded-md overflow-hidden bg-card",
          props.className,
        )}
      >
        <div className="divide-y divide-border">
          {props.steps.map((step, index) => {
            const isCompleted =
              props.completedStepIds?.includes(step.id) ||
              props.completedStepIds?.includes(step.label) ||
              index < props.activeStepIndex;
            const isActive = index === props.activeStepIndex;
            const isPending = !isActive && !isCompleted;

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex items-center gap-4 px-5 py-3.5 transition-colors",
                  isActive ? "bg-muted/50" : "",
                  isCompleted ? "opacity-60" : "",
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-foreground rounded-full" />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-colors",
                    isActive
                      ? "bg-foreground border-foreground text-background"
                      : isCompleted
                        ? "bg-muted border-border text-foreground"
                        : "bg-transparent border-border text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-medium tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    "flex-1 text-[13px] font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : isCompleted
                        ? "text-foreground/70"
                        : "text-muted-foreground",
                    isPending ? "" : "",
                  )}
                >
                  {step.label}
                </p>

                {/* Status indicator */}
                {isActive && (
                  <span className="shrink-0 text-[11px] font-medium text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                    Running
                  </span>
                )}
                {isCompleted && (
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-foreground/40" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
