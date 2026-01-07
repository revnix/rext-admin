import { Area, AreaChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import React from "react";

const chartConfig = {
  volume: {
    label: "Volume",
    color: "#3b82f6",
  },
};

export function MonthlyVolumeCard({ volume = "0", className = "" }) {
  const sparkData = React.useMemo(() => {
    const numericVolume = parseFloat(volume.replace(/[^0-9.]/g, "")) || 0;
    const base = numericVolume > 0 ? numericVolume : 1.2;

    // Generate a semi-random but deterministic trend
    return Array.from({ length: 10 }, (_, i) => ({
      date: i,
      volume: base * (0.85 + Math.sin(i * 1.5) * 0.1 + (i / 10) * 0.1),
    }));
  }, [volume]);

  return (
    <>
      <div className="flex flex-col">
        <h3 className="text-3xl font-bold text-gray-900">{volume}</h3>
        <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
          Avg. searches per month
        </p>
      </div>

      <div className="h-12 w-full mt-3">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              dataKey="volume"
              type="monotone"
              fill="url(#fillVolume)"
              stroke="#3b82f6"
              strokeWidth={2}
              isAnimationActive={true}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}
