"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export const description = "A keyword difficulty gauge chart";

const DIFFICULTY_STOPS = [
  { offset: "0%", color: "var(--color-success-500)" },
  { offset: "15%", color: "var(--color-success-400)" },
  { offset: "30%", color: "var(--color-success-300)" },
  { offset: "50%", color: "var(--color-warning-500)" },
  { offset: "70%", color: "var(--color-warning-600)" },
  { offset: "85%", color: "var(--color-error-500)" },
  { offset: "100%", color: "var(--color-error-600)" },
] as const;

const REMAINING_COLOR = "var(--color-gray-200)";

// Chart configuration
const chartConfig = {
  score: {
    label: "Difficulty Score",
  },
  remaining: {
    label: "Remaining",
    color: REMAINING_COLOR,
  },
} satisfies ChartConfig;

// Helper function to get difficulty label based on score
const getDifficultyLabel = (score: number) => {
  if (score <= 10) return "Easy";
  if (score <= 30) return "Medium";
  if (score <= 70) return "Hard";
  return "Super Hard";
};

/**
 * Props for keyword difficulty radial chart rendering.
 */
interface ChartRadialStackedProps {
  /** Difficulty score expected in 0-100 range (clamped at runtime). */
  difficultyScore?: number;
  /** Optional className for sizing/layout overrides. */
  className?: string;
}

/**
 * Visualizes keyword difficulty as a radial stacked chart with difficulty labeling.
 */
export function ChartRadialStacked({
  difficultyScore,
  className,
}: ChartRadialStackedProps) {
  // Clamp score between 0 and 100
  const clampedScore = difficultyScore
    ? Math.max(0, Math.min(100, difficultyScore))
    : 0;
  const remaining = 100 - clampedScore;
  const difficultyLabel = getDifficultyLabel(clampedScore);
  const chartData = [{ score: clampedScore, remaining }];

  return (
    <ChartContainer
      config={chartConfig}
      className={className ?? "mx-auto aspect-square w-full max-w-[200px]"}
    >
      <RadialBarChart
        data={chartData}
        startAngle={200}
        endAngle={-20}
        innerRadius={70}
        outerRadius={120}
        barGap={0}
        barCategoryGap={0}
      >
        {/* SVG Gradient - uses userSpaceOnUse to position gradient across full chart width */}
        <defs>
          <linearGradient
            id="difficultyGradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="100"
            x2="200"
            y2="100"
          >
            {DIFFICULTY_STOPS.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        </defs>

        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                const cx = viewBox.cx || 0;
                const cy = viewBox.cy || 0;
                return (
                  <text x={cx} y={cy} textAnchor="middle">
                    <tspan
                      x={cx}
                      y={cy - 8}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {difficultyScore}
                    </tspan>
                    <tspan
                      x={cx}
                      y={cy + 14}
                      className="fill-muted-foreground text-sm"
                    >
                      {difficultyLabel}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>

        {/* Score portion with gradient - colors positioned correctly across full arc */}
        <RadialBar
          dataKey="score"
          stackId="a"
          cornerRadius={0}
          fill="url(#difficultyGradient)"
          stroke="none"
        />

        {/* Remaining portion in gray */}
        <RadialBar
          dataKey="remaining"
          stackId="a"
          cornerRadius={0}
          fill={REMAINING_COLOR}
          stroke="none"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}
