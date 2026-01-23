"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export const description = "A keyword difficulty gauge chart";

// Chart configuration
const chartConfig = {
  score: {
    label: "Difficulty Score",
  },
  remaining: {
    label: "Remaining",
    color: "#e5e7eb",
  },
} satisfies ChartConfig;

// Helper function to get difficulty label based on score
const getDifficultyLabel = (score: number) => {
  if (score <= 10) return "Easy";
  if (score <= 30) return "Medium";
  if (score <= 70) return "Hard";
  return "Super Hard";
};

interface ChartRadialStackedProps {
  difficultyScore?: number;
  className?: string;
}

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
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="15%" stopColor="#4ade80" />
            <stop offset="30%" stopColor="#84cc16" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
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
          fill="#e5e7eb"
          stroke="none"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}
