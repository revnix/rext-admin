import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A section's place while the outline is written: its heading, its points, its sub-sections. */
interface Place {
  heading: string;
  points: string[];
  subs?: { heading: string; points: string[] }[];
}

// Uneven on purpose, as an outline is: some sections have sub-sections, some only points.
const PLACES: Place[] = [
  {
    heading: "w-2/5",
    points: ["w-4/5", "w-3/5"],
    subs: [
      { heading: "w-1/3", points: ["w-2/3"] },
      { heading: "w-2/5", points: ["w-1/2"] },
    ],
  },
  { heading: "w-1/2", points: ["w-3/4", "w-2/3", "w-1/2"] },
  {
    heading: "w-1/3",
    points: ["w-3/5"],
    subs: [{ heading: "w-2/5", points: ["w-3/5", "w-1/2"] }],
  },
  { heading: "w-2/5", points: ["w-2/3", "w-1/2"] },
];

/** A heading's line: where the level's tag and the heading will be. */
function HeadingBars({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-7 shrink-0" />
      <Skeleton className={cn("h-5", width)} />
    </div>
  );
}

/** Where a section's points will be, under its heading. */
function PointBars({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-2 pl-9">
      {widths.map((width, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: bars that never change or reorder, of repeating widths
        <Skeleton key={index} className={cn("h-3.5", width)} />
      ))}
    </div>
  );
}

/**
 * The outline's shape while it is written (rext-control#836): sections with their sub-sections
 * nested and each one's points under it, as the outline will show them. Nothing of the outline
 * itself shows before it is whole; the run's stages beside it say how far it is.
 */
export function OutlineSkeleton() {
  return (
    <div data-slot="outline-skeleton">
      <span className="sr-only">The outline is being written.</span>
      <div
        aria-hidden="true"
        className="divide-y divide-border rounded-md border border-border bg-card"
      >
        {PLACES.map((place, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: places that never change or reorder
          <div key={index} className="space-y-3 px-4 py-4">
            <HeadingBars width={place.heading} />
            <PointBars widths={place.points} />
            {place.subs?.map((sub, at) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: places that never change or reorder
                key={at}
                className="ml-3 space-y-3 border-l border-border pl-5"
              >
                <HeadingBars width={sub.heading} />
                <PointBars widths={sub.points} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The sources' shape while the outline is written: two of its lists, each with its heading, its
 * line and its numbered rows. The sources themselves show with the outline, not before it.
 */
export function SourcesSkeleton() {
  return (
    <div data-slot="sources-skeleton">
      <span className="sr-only">
        The sources show once the outline is written.
      </span>
      <div aria-hidden="true" className="space-y-8">
        {[5, 3].map((rows) => (
          <div key={rows} className="space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
            <div className="divide-y divide-border">
              {PLACES.concat(PLACES)
                .slice(0, rows)
                .map((place, index) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: rows that never change or reorder
                    key={index}
                    className="flex gap-3 py-2.5"
                  >
                    <Skeleton className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className={cn("h-4", place.heading)} />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
