"use client";

import { useEffect, useRef } from "react";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CalendarEntry } from "@/types/content";
import { longDayName, monthName, timeIn } from "./calendar-dates";

/**
 * The calendar's list lens: the month's scheduled and published articles day by day, the same items
 * as the grid in a list (research 06 §9). `focusDay` scrolls to a day and puts the focus on it, for
 * the grid's "n more".
 */
export function CalendarAgenda({
  month,
  calendar,
  today,
  timeZone,
  focusDay,
  readyHref,
  onOpen,
}: {
  /** `YYYY-MM`. */
  month: string;
  calendar: Record<string, CalendarEntry[]>;
  today: string;
  timeZone: string;
  focusDay: string | null;
  /** The library's articles that are ready to schedule. */
  readyHref: string;
  onOpen: (entry: CalendarEntry, day: string) => void;
}) {
  const days = Object.keys(calendar).sort();
  const headings = useRef(new Map<string, HTMLHeadingElement>());

  useEffect(() => {
    if (!focusDay) return;
    const heading = headings.current.get(focusDay);
    heading?.scrollIntoView({ block: "start" });
    heading?.focus();
  }, [focusDay]);

  if (days.length === 0) {
    return (
      <EmptyState
        title={`Nothing in ${monthName(month)}`}
        description="Scheduled and published articles show here, day by day."
        action={{ label: "See articles ready to schedule", href: readyHref }}
      />
    );
  }

  return (
    <ol className="flex flex-col gap-6">
      {days.map((day) => (
        <li key={day} className="flex flex-col gap-2">
          <h2
            ref={(node) => {
              if (node) headings.current.set(day, node);
              else headings.current.delete(day);
            }}
            tabIndex={-1}
            className="scroll-mt-4 text-sm font-medium text-foreground outline-none"
          >
            {longDayName(day)}
            {day === today && (
              <span className="text-muted-foreground"> · Today</span>
            )}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            {calendar[day].map((entry) => (
              <li key={`${entry.id}-${entry.platform}`}>
                <button
                  type="button"
                  onClick={() => onOpen(entry, day)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="num w-16 shrink-0 text-sm text-muted-foreground">
                    {timeIn(entry.date, timeZone)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium wrap-break-word text-foreground">
                    {entry.title || "Untitled"}
                  </span>
                  <ContentStatusBadge status={entry.status} />
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
