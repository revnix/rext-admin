"use client";

import { Loader2, Check, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
          className={cn(sizeClass, "animate-spin text-primary")}
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
        {Array.from({ length: fields }).map((item) => (
          <div key={`field-${item}`} className="space-y-2">
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
          "w-full border border-border/40 rounded-xl overflow-hidden bg-card",
          props.className,
        )}
      >
        <div className="divide-y divide-border/25">
          {props.steps.map((step, index) => {
            const isCompleted =
              props.completedStepIds?.includes(step.id) ||
              props.completedStepIds?.includes(step.label) ||
              index < props.activeStepIndex;
            const isActive = index === props.activeStepIndex;
            const isPending = !isActive && !isCompleted;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "relative flex items-center gap-4 px-5 py-3.5 transition-colors duration-300",
                  isActive ? "bg-primary/[0.04]" : "",
                  isCompleted ? "opacity-60" : "",
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.span
                    layoutId="active-bar"
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/15 border-primary/25 text-primary"
                        : "bg-transparent border-border/40 text-muted-foreground/40",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="text-[9px] font-black">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    "flex-1 text-[13px] font-medium transition-colors duration-200",
                    isActive
                      ? "text-foreground"
                      : isCompleted
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground/35",
                    isPending ? "" : "",
                  )}
                >
                  {step.label}
                </p>

                {/* Status indicator */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      key="active"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="shrink-0 text-[9px] font-bold text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15"
                    >
                      Running
                    </motion.span>
                  )}
                  {isCompleted && (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/40"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
