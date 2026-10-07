import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one chart-like device for a 0 to 100 score (design/app-language.md §6): one colour on a track
 * in the inset surface, the number in the middle. `label` names the score, e.g. "On-page score": the
 * ring is a `meter` for assistive technology, as components/ui/meter.tsx is, and the drawing's title
 * is the pointer's tooltip.
 *
 * `tone` is the arc's colour class, for a score whose levels have colours of their own (keyword
 * difficulty, FB2.9); every other score keeps the one colour. `compact` is a 20 px mark for a table
 * cell: a thicker arc, and nothing inside. `children` stand in the middle in place of the number.
 */
export function ScoreRing({
  value,
  label,
  className,
  tone = "text-foreground",
  compact = false,
  children,
}: {
  value: number;
  label: string;
  className?: string;
  tone?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  // In the 64-unit box, a unit inside its edge: 6 units at 64 px, and 10 at 20 px, where 6 would be
  // under 2 px.
  const stroke = compact ? 10 : 6;
  const radius = 31 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  // Spread, as Meter's: a native <meter> can't be drawn as a ring.
  const meter = {
    role: "meter",
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": score,
  };
  return (
    <div
      data-slot="score-ring"
      {...meter}
      className={cn(
        "relative grid shrink-0 place-items-center",
        compact ? "size-5" : "size-16",
        className,
      )}
    >
      {/* The title is one string: React renders a title's several text children as an empty title
          on the server, and the page then fails to hydrate. */}
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <title>{`${label}: ${score} out of 100`}</title>
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke="currentColor"
          className="text-surface-inset"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={tone}
        />
      </svg>
      {!compact &&
        (children ?? (
          <span className="num text-section text-foreground" aria-hidden>
            {score}
          </span>
        ))}
    </div>
  );
}
