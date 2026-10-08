"use client";

import { format, parseISO } from "date-fns";
import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { workspaceRoutes } from "@/lib/routes";
import type { CalendarEntry } from "@/types/content";
import { longDayName, timeIn } from "./calendar-dates";

export interface CalendarItem {
  entry: CalendarEntry;
  /** The day it sits on, `YYYY-MM-DD`. */
  day: string;
}

/**
 * One calendar item in a sheet beside the month (design/app-language.md §6: a sheet for a calendar
 * item, so the month stays in view): when and where it publishes, the article, and for a scheduled
 * one a day picker that moves it (the way to move it without dragging) and the cancel.
 */
export function CalendarItemSheet({
  item,
  workspaceSlug,
  today,
  timeZone,
  canMove,
  cancelling,
  onClose,
  onMove,
  onCancelSchedule,
}: {
  item: CalendarItem | null;
  workspaceSlug: string;
  /** Today in the account's timezone, `YYYY-MM-DD`. */
  today: string;
  timeZone: string;
  /** Whether the person may move or cancel a scheduled publish (`content.publish`). */
  canMove: boolean;
  cancelling: boolean;
  onClose: () => void;
  onMove: (entry: CalendarEntry, fromDay: string, toDay: string) => void;
  onCancelSchedule: (entry: CalendarEntry) => void;
}) {
  const entry = item?.entry;
  const day = item?.day ?? today;
  const scheduled = entry?.status === "scheduled";
  const movable = canMove && scheduled && day >= today;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        {entry && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6">
                {entry.title || "Untitled"}
              </SheetTitle>
              <SheetDescription>
                {scheduled ? "Publishes on" : "Published on"} {longDayName(day)}{" "}
                at {timeIn(entry.date, timeZone)}
              </SheetDescription>
            </SheetHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <ContentStatusBadge status={entry.status} />
              </dd>
              <dt className="text-muted-foreground">Site</dt>
              <dd>{entry.platform === "shopify" ? "Shopify" : "WordPress"}</dd>
              <dt className="text-muted-foreground">Times in</dt>
              <dd>{timeZone}</dd>
            </dl>

            {movable && (
              <section
                aria-labelledby="move-day"
                className="flex flex-col gap-2 px-4"
              >
                <h3 id="move-day" className="text-sm font-medium">
                  Move to another day
                </h3>
                <p className="text-sm text-muted-foreground">
                  It keeps its time of day. Nothing else changes.
                </p>
                <Calendar
                  mode="single"
                  selected={parseISO(day)}
                  defaultMonth={parseISO(day)}
                  disabled={{ before: parseISO(today) }}
                  onSelect={(picked) => {
                    const toDay = picked && format(picked, "yyyy-MM-dd");
                    if (toDay && toDay !== day) onMove(entry, day, toDay);
                  }}
                  className="rounded-md border border-border"
                />
              </section>
            )}

            <SheetFooter className="flex-col gap-2">
              <Button data-rec="show" asChild>
                <Link
                  href={
                    workspaceRoutes.contentDetail(
                      workspaceSlug,
                      entry.id,
                    ) as Route
                  }
                >
                  Open article
                </Link>
              </Button>
              {entry.url && (
                <Button data-rec="show" asChild variant="outline">
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    View on the site
                    <ExternalLink />
                  </a>
                </Button>
              )}
              {canMove && scheduled && (
                <ConfirmationDialog
                  title="Cancel this schedule?"
                  description="The article goes back to draft and won't be published. You can schedule it again from the article."
                  confirmText="Cancel schedule"
                  cancelText="Keep it scheduled"
                  onConfirm={() => onCancelSchedule(entry)}
                >
                  <Button
                    data-rec="show"
                    variant="outline"
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling…" : "Cancel schedule"}
                  </Button>
                </ConfirmationDialog>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
