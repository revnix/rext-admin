import { cn } from "@/lib/utils";

/**
 * The one chart-like device for a 0 to 100 score (design/app-language.md §6): one colour on a track
 * in the inset surface, the number in the middle. `label` names the score for assistive technology,
 * e.g. "On-page score".
 */
export function ScoreRing({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const circumference = 2 * Math.PI * 28;
  return (
    <div
      data-slot="score-ring"
      className={cn(
        "relative grid size-16 shrink-0 place-items-center",
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 size-full -rotate-90"
      >
        <title>
          {label}: {score} out of 100
        </title>
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="6"
          fill="none"
          stroke="currentColor"
          className="text-surface-inset"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="text-foreground"
        />
      </svg>
      <span className="num text-section text-foreground" aria-hidden>
        {score}
      </span>
    </div>
  );
}
