import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageFrame } from "./page-frame";

/**
 * The loading shapes of the layouts (design/app-language.md §8): grey blocks where the page's header
 * and body will be, so nothing jumps when it arrives. They appear only after 200 ms, by a CSS delay,
 * so a server-rendered loading.tsx gets the delay too and a fast load never flashes them. Each says
 * `label` to assistive technology.
 *
 * `PageSkeleton` is a whole page in its frame, for a loading.tsx (or a page waiting on its first
 * data) where no layout is drawn yet; `SectionSkeleton` is a settings section, inside SettingsPage.
 */
const SHOW_AFTER = "animate-in fade-in delay-200 fill-mode-backwards";

export type PageSkeletonLayout = "list" | "detail" | "form";

export function PageSkeleton({
  layout = "list",
  rows,
  stats = 0,
  label = "Loading",
}: {
  layout?: PageSkeletonLayout;
  /** Table rows (list), text lines (detail) or fields (form). */
  rows?: number;
  /** Figure cards above a list, as on the admin pages. */
  stats?: number;
  label?: string;
}) {
  return (
    <PageFrame>
      <Busy label={label} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          {layout !== "form" && <Skeleton className="h-9 w-32" />}
        </div>
        {layout === "list" && <ListShape rows={rows ?? 8} stats={stats} />}
        {layout === "detail" && <DetailShape lines={rows ?? 6} />}
        {layout === "form" && (
          <div className="max-w-(--form-max)">
            <Fields count={rows ?? 4} />
          </div>
        )}
      </Busy>
    </PageFrame>
  );
}

export function SectionSkeleton({
  fields = 4,
  label = "Loading",
}: {
  fields?: number;
  label?: string;
}) {
  return (
    <Busy label={label} className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Fields count={fields} />
    </Busy>
  );
}

function Busy({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" className={cn(SHOW_AFTER, className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function ListShape({ rows, stats }: { rows: number; stats: number }) {
  return (
    <div className="flex flex-col gap-4">
      {stats > 0 && (
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            stats === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
          )}
        >
          {ids("stat", stats).map((id) => (
            <Skeleton key={id} className="h-24" />
          ))}
        </div>
      )}
      <Skeleton className="h-9 w-full max-w-xs" />
      <div className="overflow-hidden rounded-(--card-radius) border border-border">
        <Skeleton className="h-10 rounded-none" />
        {ids("row", rows).map((id) => (
          <div key={id} className="border-t border-border px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailShape({ lines }: { lines: number }) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {ids("line", lines).map((id) => (
          <Skeleton key={id} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

function Fields({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-6">
      {ids("field", count).map((id) => (
        <div key={id} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Stable keys for n placeholder rows. */
function ids(prefix: string, n: number) {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i}`);
}
