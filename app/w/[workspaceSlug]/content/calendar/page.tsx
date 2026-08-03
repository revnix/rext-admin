"use client";

import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Trash2,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useContentCalendar, useCancelSchedule } from "@/hooks/use-content";
import { useWorkspace } from "@/providers/workspace-provider";
import type { CalendarEntry } from "@/types/content";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function entryBadgeClass(entry: CalendarEntry) {
  if (entry.status === "scheduled")
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (entry.platform === "shopify")
    return "bg-green-100 text-green-700 border-green-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function platformLabel(platform: string) {
  return platform === "shopify" ? "Shopify" : "WordPress";
}

export default function ContentCalendarPage() {
  const { workspaceId, workspace } = useWorkspace();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mobileDay, setMobileDay] = useState(now.getDate());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, error } = useContentCalendar(
    workspaceId,
    year,
    month,
  );
  const cancelSchedule = useCancelSchedule();

  const calendarMap = data?.calendar ?? {};

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const dayKey = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const goToDate = (dateStr: string) => {
    if (!dateStr) return;
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return;
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setMobileDay(d.getDate());
  };

  const shiftMobileDay = (delta: number) => {
    const d = new Date(year, month - 1, mobileDay + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setMobileDay(d.getDate());
  };

  const mobileDateKey = dayKey(mobileDay);
  const mobileEntries: CalendarEntry[] = calendarMap[mobileDateKey] ?? [];
  const isMobileToday =
    mobileDay === now.getDate() &&
    month === now.getMonth() + 1 &&
    year === now.getFullYear();

  const selectedEntries: CalendarEntry[] = selectedDay
    ? (calendarMap[selectedDay] ?? [])
    : [];

  const handleCancelSchedule = async (contentId: string) => {
    setCancellingId(contentId);
    await cancelSchedule.mutateAsync({ workspaceId, contentId });
    setCancellingId(null);
    setSelectedDay((prev) => {
      if (!prev) return null;
      const remaining = (data?.calendar?.[prev] ?? []).filter(
        (e) => !(e.id === contentId && e.status === "scheduled"),
      );
      return remaining.length > 0 ? prev : null;
    });
  };

  return (
    <PageLayout
      title="Content Calendar"
      description={`Published and scheduled content for ${workspace?.name ?? "this workspace"}.`}
      actions={
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load calendar. Please try again.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader className="pb-2 gap-4">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              {data?.total_items ?? 0} item{data?.total_items !== 1 ? "s" : ""}{" "}
              this month
            </CardTitle>

            <div className="flex sm:hidden items-center justify-between gap-1.5 mt-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => shiftMobileDay(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center justify-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm font-semibold whitespace-nowrap">
                  {new Date(`${mobileDateKey}T00:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                  )}
                </span>
                {isMobileToday && (
                  <Badge className="shrink-0 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                    Today
                  </Badge>
                )}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => shiftMobileDay(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <label className="relative shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 pointer-events-none"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
                <input
                  type="date"
                  value={mobileDateKey}
                  onChange={(e) => goToDate(e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  aria-label="Go to date"
                />
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden sm:block">
              <div className="grid grid-cols-7 border-b">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfWeek }, (_, i) => i).map(
                  (offset) => (
                    <div
                      key={`pre-${year}-${month}-${offset}`}
                      className="min-h-20 border-b border-r last:border-r-0 bg-muted/20"
                    />
                  ),
                )}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (day) => {
                    const key = dayKey(day);
                    const entries = calendarMap[key] ?? [];
                    const isToday =
                      day === now.getDate() &&
                      month === now.getMonth() + 1 &&
                      year === now.getFullYear();

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={entries.length === 0}
                        onClick={() => setSelectedDay(key)}
                        className={cn(
                          "min-h-20 border-b border-r last:border-r-0 p-1.5 flex flex-col gap-1 w-full text-left bg-transparent",
                          entries.length > 0 &&
                            "cursor-pointer hover:bg-muted/40 transition-colors",
                          entries.length === 0 && "cursor-default",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full self-end",
                            isToday && "bg-primary text-primary-foreground",
                            !isToday && "text-foreground",
                          )}
                        >
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {entries.slice(0, 3).map((entry) => (
                            <div
                              key={`${entry.id}-${entry.platform}`}
                              className={cn(
                                "text-[10px] truncate rounded px-1 py-0.5 border font-medium",
                                entryBadgeClass(entry),
                              )}
                            >
                              {entry.title}
                            </div>
                          ))}
                          {entries.length > 3 && (
                            <span className="text-[10px] text-muted-foreground pl-1">
                              +{entries.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="sm:hidden divide-y">
              {mobileEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Inbox className="h-6 w-6" />
                  <p className="text-sm">Nothing scheduled this day</p>
                </div>
              ) : (
                mobileEntries.map((entry) => (
                  <div
                    key={`${entry.id}-${entry.platform}`}
                    className="flex flex-wrap items-start gap-3 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium wrap-break-word">
                        {entry.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            entryBadgeClass(entry),
                          )}
                        >
                          {entry.status === "scheduled" ? (
                            <Clock className="h-2.5 w-2.5 mr-1" />
                          ) : (
                            <Globe className="h-2.5 w-2.5 mr-1" />
                          )}
                          {entry.status === "scheduled"
                            ? "Scheduled"
                            : "Published"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {platformLabel(entry.platform)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.date).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                      {entry.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={cancellingId === entry.id}
                          onClick={() => handleCancelSchedule(entry.id)}
                        >
                          {cancellingId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogTitle>
            {selectedDay
              ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                )
              : ""}
          </DialogTitle>
          <div className="space-y-3 mt-2">
            {selectedEntries.map((entry) => (
              <div
                key={`${entry.id}-${entry.platform}`}
                className="flex flex-wrap sm:flex-nowrap items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium wrap-break-word">
                    {entry.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        entryBadgeClass(entry),
                      )}
                    >
                      {entry.status === "scheduled" ? (
                        <Clock className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Globe className="h-2.5 w-2.5 mr-1" />
                      )}
                      {entry.status === "scheduled" ? "Scheduled" : "Published"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {platformLabel(entry.platform)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(entry.date).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {entry.status === "scheduled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={cancellingId === entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelSchedule(entry.id);
                      }}
                    >
                      {cancellingId === entry.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
