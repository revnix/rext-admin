import { cn } from "@/lib/utils";

/**
 * How much of something is used or left (design/app-language.md §6): credits, a plan's limit. A thin
 * bar on the inset track in the text colour, in the warning colour once `low`. With a `label` it is a
 * `meter` for assistive technology; without one it is hidden, for a parent that already says the
 * numbers in words. `segmented` draws one part per unit of `max`, the filled ones first and the rest
 * hollow, for a small count where each unit is a thing (a title's three checks).
 */
export function Meter({
  value,
  max,
  low = false,
  label,
  segmented = false,
  className,
}: {
  value: number;
  max: number;
  low?: boolean;
  label?: string;
  segmented?: boolean;
  className?: string;
}) {
  // One clamped value for the bar and the meter's reading, so neither can say more than full.
  const shown = Math.min(Math.max(value, 0), Math.max(max, 0));
  const share = max > 0 ? shown / max : 0;
  const a11y = label
    ? {
        role: "meter",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-valuenow": shown,
      }
    : { "aria-hidden": true };
  if (segmented) {
    const filled = Math.round(shown);
    return (
      <span
        data-slot="meter"
        {...a11y}
        className={cn("inline-flex gap-0.5", className)}
      >
        {Array.from({ length: Math.max(Math.round(max), 0) }, (_, part) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts are alike and never reorder
            key={part}
            data-filled={part < filled}
            className={cn(
              "h-1.5 w-3 rounded-full",
              part < filled
                ? low
                  ? "bg-warning-600"
                  : "bg-foreground"
                : "border border-border-strong",
            )}
          />
        ))}
      </span>
    );
  }
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
