import type { DifficultyBand } from "@/lib/keywords/keyword-metrics";
import { cn } from "@/lib/utils";

/** Green to red by level (FB2.9 #690, the founder's option A): the ring's colour says the level,
 * and the number and the level's word always say it too. */
const BAND_COLOUR: Record<DifficultyBand, string> = {
  Easy: "text-success-600",
  Medium: "text-warning-600",
  Hard: "text-danger-500",
  "Very hard": "text-danger-700",
};

/**
 * A keyword's difficulty as a ring filled to its score in its level's colour, on the inset track.
 * `size` "lg" holds the percentage inside it (step 2's keyword card); "sm" is a table cell's mark.
 */
export function DifficultyRing({
  score,
  band,
  size = "lg",
}: {
  score: number;
  band: DifficultyBand;
  size?: "sm" | "lg";
}) {
  const box = size === "lg" ? 64 : 20;
  const stroke = size === "lg" ? 6 : 3;
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // A meter for assistive technology, as components/ui/meter.tsx is: a native <meter> can't be
  // drawn as a ring.
  const meter = {
    role: "meter",
    "aria-label": `Keyword difficulty, ${score} of 100`,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": score,
  };
  return (
    <span
      {...meter}
      className={cn(
        "relative grid shrink-0 place-items-center",
        size === "lg" ? "size-16" : "size-5",
      )}
    >
      <svg
        viewBox={`0 0 ${box} ${box}`}
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke="currentColor"
          className="text-surface-inset"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={BAND_COLOUR[band]}
        />
      </svg>
      {size === "lg" && (
        <span
          className="num text-body font-medium text-foreground"
          aria-hidden="true"
        >
          {score}%
        </span>
      )}
    </span>
  );
}
