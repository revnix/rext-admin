import { ScoreRing } from "@/components/ui/score-ring";
import type { DifficultyBand } from "@/lib/keywords/keyword-metrics";

/** Green to red by level (FB2.9 #690, the founder's option A): the ring's colour says the level,
 * and the number and the level's word always say it too. */
const BAND_COLOUR: Record<DifficultyBand, string> = {
  Easy: "text-success-600",
  Medium: "text-warning-600",
  Hard: "text-danger-500",
  "Very hard": "text-danger-700",
};

/**
 * A keyword's difficulty: the shared score ring, filled to the score in its level's colour.
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
  return (
    <ScoreRing
      value={score}
      label="Keyword difficulty"
      tone={BAND_COLOUR[band]}
      compact={size === "sm"}
    >
      <span
        className="num text-body font-medium text-foreground"
        aria-hidden="true"
      >
        {score}%
      </span>
    </ScoreRing>
  );
}
