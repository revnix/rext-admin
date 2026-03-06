"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ChartRadialStacked } from "@/components/ui/content/chart-radial-stacked";

interface SafeChartRadialStackedProps {
  difficultyScore?: number;
  className?: string;
}

function ChartFallback({
  resetError,
}: {
  error: Error;
  resetError: () => void;
  errorId: string;
  requestId?: string;
}) {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-sm font-medium text-foreground">
        Difficulty chart unavailable
      </p>
      <button
        type="button"
        onClick={resetError}
        className="mt-2 text-xs text-primary underline underline-offset-2"
      >
        Retry chart
      </button>
    </div>
  );
}

export function SafeChartRadialStacked({
  difficultyScore,
  className,
}: SafeChartRadialStackedProps) {
  return (
    <ErrorBoundary fallback={ChartFallback}>
      <ChartRadialStacked
        difficultyScore={difficultyScore}
        className={className}
      />
    </ErrorBoundary>
  );
}
