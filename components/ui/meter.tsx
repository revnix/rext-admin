import { cn } from "@/lib/utils";

/**
 * How much of something is used or left (design/app-language.md §6): credits, a plan's limit. A thin
 * bar on the inset track in the text colour, in the warning colour once `low`. With a `label` it is a
 * `meter` for assistive technology; without one it is hidden, for a parent that already says the
 * numbers in words.
 */
export function Meter({
  value,
  max,
  low = false,
  label,
  className,
}: {
  value: number;
  max: number;
  low?: boolean;
  label?: string;
  className?: string;
}) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const a11y = label
    ? {
        role: "meter",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-valuenow": value,
      }
    : { "aria-hidden": true };
  return (
    <span
      data-slot="meter"
      {...a11y}
      className={cn(
        "block h-1 overflow-hidden rounded-full bg-surface-inset",
        className,
      )}
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width] duration-(--duration-base) ease-out",
          low ? "bg-warning-600" : "bg-foreground",
        )}
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </span>
  );
}
