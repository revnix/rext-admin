"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ChartRadialStacked } from "@/components/ui/content/chart-radial-stacked";

interface SafeChartRadialStackedProps {
  difficultyScore?: number;
  className?: string;
}

export function SafeChartRadialStacked({
  difficultyScore,
  className,
}: SafeChartRadialStackedProps) {
  return (
    <ErrorBoundary title="The difficulty chart didn't load">
      <ChartRadialStacked
        difficultyScore={difficultyScore}
        className={className}
      />
    </ErrorBoundary>
  );
}
