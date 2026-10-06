"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryStates } from "nuqs";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarAgenda } from "@/components/calendar/calendar-agenda";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import {
  knownTimeZone,
  monthName,
  monthOf,
  shiftMonth,
  shortDayName,
  todayIn,
} from "@/components/calendar/calendar-dates";
import {
  type CalendarItem,
  CalendarItemSheet,
} from "@/components/calendar/calendar-item-sheet";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WorkingSurface } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCancelSchedule,
  useContentCalendar,
  useRescheduleContent,
} from "@/hooks/use-content";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useShowAfter } from "@/hooks/use-show-after";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import {
  type CalendarView,
  calendarParams,
} from "@/lib/search-params/calendar";
import { useWorkspace } from "@/providers/workspace-provider";
import type { CalendarEntry } from "@/types/content";

/**
 * The calendar (plans/app/D-pages.md §2.5): one set of articles through three lenses. The month
 * grid holds what is scheduled and published, and a scheduled article moves to another day by
 * dragging it or from its sheet; the board shows every article by its status; the list shows the
 * month day by day. The days are the account's timezone's, as the backend counts them.
 */
export default function ContentCalendarPage() {
  usePageTitle("Calendar");
  return (
    <WorkingSurface
      title="Calendar"
      description="Scheduled and published articles by day, in your account's timezone."
    >
      {/* Nothing is read before the permission is known: the board lists every article. */}
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.READ}
        showLoading={false}
        fallback={
          <Notice tone="warning" title="The calendar isn't open to you">
            Your role in this workspace can't read its articles. A workspace
            owner can change that.
          </Notice>
        }
      >
        <CalendarBody />
      </PermissionGuard>
    </WorkingSurface>
  );
}

function CalendarBody() {
  const { workspaceId, workspaceSlug } = useWorkspace();
  const [{ view, month: monthParam }, setParams] =
    useQueryStates(calendarParams);
  // The account's timezone, once the backend has named it; until then the browser's picks the month.
  const [accountZone, setAccountZone] = useState<string | null>(null);
  const browserZone = knownTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const month = monthParam ?? monthOf(todayIn(accountZone ?? browserZone));

  const [year, monthNumber] = month.split("-").map(Number);
  const calendarQuery = useContentCalendar(workspaceId, year, monthNumber);
  const reportedZone = calendarQuery.data?.timezone;
  useEffect(() => {
    if (reportedZone) setAccountZone(knownTimeZone(reportedZone));
  }, [reportedZone]);
  const timeZone = accountZone ?? knownTimeZone(reportedZone);
  const today = todayIn(timeZone);
  const showSkeleton = useShowAfter(calendarQuery.isLoading);

  const { hasPermission: canMove } = useWorkspacePermission(
    CONTENT_PERMISSIONS.PUBLISH,
    workspaceId,
  );
  const reschedule = useRescheduleContent();
  const cancelSchedule = useCancelSchedule();
  const [item, setItem] = useState<CalendarItem | null>(null);
  const [focusDay, setFocusDay] = useState<string | null>(null);

  const calendar = calendarQuery.data?.calendar ?? {};
  const library = workspaceRoutes.content(workspaceSlug);

  const move = (
    entry: CalendarEntry,
    fromDay: string,
    toDay: string,
    undo = true,
  ) => {
    reschedule.mutate(
      { workspaceId, contentId: entry.id, fromDay, toDay },
      {
        onSuccess: () => {
          setItem((open) =>
            open?.entry.id === entry.id ? { entry, day: toDay } : open,
          );
          toast.success(
            `${entry.title || "The article"} moved to ${shortDayName(toDay)}`,
            undo && fromDay >= todayIn(timeZone)
              ? {
                  action: {
                    label: "Undo",
                    onClick: () => move(entry, toDay, fromDay, false),
                  },
                }
              : undefined,
          );
        },
      },
    );
  };

  const cancel = (entry: CalendarEntry) => {
    cancelSchedule.mutate(
      { workspaceId, contentId: entry.id },
      { onSuccess: () => setItem(null) },
    );
  };

  const goToMonth = (next: string | null) => {
    setFocusDay(null);
    setParams({ month: next });
  };

  const monthNav = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous month"
        onClick={() => goToMonth(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <p
        aria-live="polite"
        className="num min-w-32 text-center text-sm font-medium text-foreground"
      >
        {monthName(month)}
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next month"
        onClick={() => goToMonth(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
      {month !== monthOf(today) && (
        <Button variant="outline" onClick={() => goToMonth(null)}>
          Today
        </Button>
      )}
      <p className="text-sm text-muted-foreground">Times in {timeZone}</p>
    </div>
  );

  const monthBody = (render: () => ReactNode) => {
    if (calendarQuery.error) {
      return (
        <Notice
          tone="danger"
          title="The calendar didn't load"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => calendarQuery.refetch()}
            >
              Try again
            </Button>
          }
        >
          The month couldn't be read from the server.
        </Notice>
      );
    }
    if (calendarQuery.isLoading) {
      return showSkeleton ? (
        <div role="status">
          <span className="sr-only">Loading the calendar</span>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : null;
    }
    return render();
  };

  return (
    <>
      <Tabs
        value={view}
        onValueChange={(next) => setParams({ view: next as CalendarView })}
        className="gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="View">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          {view !== "board" && monthNav}
        </div>

        <TabsContent value="month">
          {monthBody(() => (
            <MonthGrid
              month={month}
              calendar={calendar}
              today={today}
              timeZone={timeZone}
              canMove={canMove}
              onOpen={(entry, day) => setItem({ entry, day })}
              onMove={move}
              onShowDay={(day) => {
                setFocusDay(day);
                setParams({ view: "list" });
              }}
            />
          ))}
        </TabsContent>
        <TabsContent value="board">
          <CalendarBoard
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
        </TabsContent>
        <TabsContent value="list">
          {monthBody(() => (
            <CalendarAgenda
              month={month}
              calendar={calendar}
              today={today}
              timeZone={timeZone}
              focusDay={focusDay}
              readyHref={`${library}?status=ready`}
              onOpen={(entry, day) => setItem({ entry, day })}
            />
          ))}
        </TabsContent>
      </Tabs>

      <CalendarItemSheet
        item={item}
        workspaceSlug={workspaceSlug}
        today={today}
        timeZone={timeZone}
        canMove={canMove}
        cancelling={cancelSchedule.isPending}
        onClose={() => setItem(null)}
        onMove={move}
        onCancelSchedule={cancel}
      />
    </>
  );
}
