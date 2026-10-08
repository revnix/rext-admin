import { Check, Circle } from "lucide-react";
import type { StructureEntry } from "@/lib/generate-content/article-structure";
import { cn } from "@/lib/utils";

/**
 * The article's structure as layers (task 703): each main section with its "H2" mark, its
 * subsections indented under a guide line with "H3". While the article is being written, each row
 * also says where it stands: written, being written, or still to come. A row jumps to its heading.
 */
export function StructureTree({
  entries,
  showState = false,
  onPick,
}: {
  entries: StructureEntry[];
  /** The article is still being written: show each row's state. */
  showState?: boolean;
  onPick?: (heading: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <nav aria-label="Structure">
      <ol className="space-y-0.5">
        {entries.map((entry, index) => {
          const waiting = entry.state === "waiting";
          const writing = showState && entry.state === "writing";
          return (
            <li
              // Two sections may share a heading; the position tells them apart.
              // biome-ignore lint/suspicious/noArrayIndexKey: the list is rebuilt whole, never reordered in place
              key={`${index}-${entry.heading}`}
              className={cn(
                entry.level === 3 && "ml-7 border-l border-border pl-2",
              )}
            >
              <button
                type="button"
                disabled={waiting}
                aria-current={writing ? "step" : undefined}
                onClick={() => onPick?.(entry.heading)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left",
                  waiting
                    ? "cursor-default text-muted-foreground"
                    : "cursor-pointer text-foreground hover:bg-muted",
                  writing && "bg-muted",
                )}
              >
                {showState ? <State state={entry.state} /> : null}
                <span className="num w-6 shrink-0 pt-px text-caption text-muted-foreground">
                  H{entry.level}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    entry.level === 2 ? "text-body" : "text-table",
                  )}
                >
                  {entry.heading}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function State({ state }: { state: StructureEntry["state"] }) {
  if (state === "done") {
    return (
      <>
        <Check size={16} aria-hidden className="mt-px shrink-0" />
        <span className="sr-only">Written:</span>
      </>
    );
  }
  if (state === "writing") {
    return (
      <>
        <span
          aria-hidden
          className="mx-[3px] mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/25"
        />
        <span className="sr-only">Being written:</span>
      </>
    );
  }
  return (
    <>
      <Circle size={16} aria-hidden className="mt-px shrink-0 opacity-60" />
      <span className="sr-only">Still to come:</span>
    </>
  );
}
