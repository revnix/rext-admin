"use client";

import {
  type Announcements,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  type ScreenReaderInstructions,
  TouchSensor,
  type UniqueIdentifier,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/types/content";
import {
  gridDays,
  longDayName,
  monthOf,
  shiftDay,
  timeIn,
} from "./calendar-dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Entries a day shows in the grid before "n more". */
const SHOWN_PER_DAY = 3;
const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "To move a scheduled article to another day, press Space, pick the day with the arrow keys and press Space again. Escape cancels. Enter opens the article's details.",
};

interface DragData {
  entry: CalendarEntry;
  day: string;
}

export interface MonthGridProps {
  /** `YYYY-MM`. */
  month: string;
  /** The month's entries by day, `YYYY-MM-DD`. */
  calendar: Record<string, CalendarEntry[]>;
  /** Today in the account's timezone, `YYYY-MM-DD`: earlier days take no moves. */
  today: string;
  timeZone: string;
  /** Whether the person may move a scheduled publish (`content.publish`). */
  canMove: boolean;
  onOpen: (entry: CalendarEntry, day: string) => void;
  onMove: (entry: CalendarEntry, fromDay: string, toDay: string) => void;
  /** Shows every entry of a day that has more than the grid fits. */
  onShowDay: (day: string) => void;
}

/**
 * The month as a grid of days (design/app-language.md §6, research 06 §9): scheduled articles drag
 * to another day with a mouse, a finger (a long press) or the keyboard, and the drop changes the
 * publish date only. Published articles stay where they are. Under 640 px the grid is a picker of
 * days, with the picked day's articles beneath it.
 */
export function MonthGrid({
  month,
  calendar,
  today,
  timeZone,
  canMove,
  onOpen,
  onMove,
  onShowDay,
}: MonthGridProps) {
  const days = useMemo(() => gridDays(month), [month]);
  const [active, setActive] = useState<DragData | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const pickedDay =
    picked && monthOf(picked) === month
      ? picked
      : monthOf(today) === month
        ? today
        : (Object.keys(calendar).sort()[0] ?? `${month}-01`);

  const takesMoves = (day: string) => monthOf(day) === month && day >= today;
  // The keyboard's position while it carries an entry: a day, moved by the arrows.
  const keyboardDay = useRef<string | null>(null);
  const takesMovesRef = useRef(takesMoves);
  takesMovesRef.current = takesMoves;

  const coordinateGetter = useMemo<KeyboardCoordinateGetter>(
    () =>
      (event, { context }) => {
        const step = ARROW_STEPS[event.code];
        if (!step || !keyboardDay.current) return undefined;
        event.preventDefault();
        const next = shiftDay(keyboardDay.current, step);
        const rect = context.droppableRects.get(next);
        if (!rect || !takesMovesRef.current(next)) return undefined;
        keyboardDay.current = next;
        return { x: rect.left + 4, y: rect.top + 4 };
      },
    [],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
      keyboardCodes: {
        start: ["Space"],
        cancel: ["Escape"],
        end: ["Space", "Enter"],
      },
    }),
  );

  const announcements = useMemo<Announcements>(() => {
    const about = (id: UniqueIdentifier, data: unknown) => {
      const drag = data as DragData | undefined;
      return {
        title: drag?.entry.title || "The article",
        from: drag ? longDayName(drag.day) : String(id),
      };
    };
    return {
      onDragStart: ({ active: a }) => {
        const { title, from } = about(a.id, a.data.current);
        return `Picked up ${title}, on ${from}.`;
      },
      onDragOver: ({ over }) =>
        over
          ? `Over ${longDayName(String(over.id))}.`
          : "Not over a day it can move to.",
      onDragEnd: ({ active: a, over }) => {
        const { title, from } = about(a.id, a.data.current);
        const drag = a.data.current as DragData | undefined;
        return over && String(over.id) !== drag?.day
          ? `${title} moves to ${longDayName(String(over.id))}.`
          : `${title} stays on ${from}.`;
      },
      onDragCancel: ({ active: a }) => {
        const { title, from } = about(a.id, a.data.current);
        return `Moving cancelled. ${title} stays on ${from}.`;
      },
    };
  }, []);

  const handleDragStart = ({ active: a }: DragStartEvent) => {
    const drag = a.data.current as DragData | undefined;
    keyboardDay.current = drag?.day ?? null;
    setActive(drag ?? null);
  };

  const handleDragEnd = ({ active: a, over }: DragEndEvent) => {
    const drag = a.data.current as DragData | undefined;
    keyboardDay.current = null;
    setActive(null);
    if (!drag || !over) return;
    const toDay = String(over.id);
    if (toDay !== drag.day && takesMoves(toDay)) {
      onMove(drag.entry, drag.day, toDay);
    }
  };

  const pickedEntries = calendar[pickedDay] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{
          announcements,
          screenReaderInstructions: INSTRUCTIONS,
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          keyboardDay.current = null;
          setActive(null);
        }}
      >
        <div className="overflow-hidden rounded-(--card-radius) border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border" aria-hidden>
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0">
            {days.map((day) => (
              <DayCell
                key={day}
                day={day}
                inMonth={monthOf(day) === month}
                isToday={day === today}
                isPicked={day === pickedDay}
                takesMoves={canMove && takesMoves(day)}
                entries={calendar[day] ?? []}
                timeZone={timeZone}
                canMove={canMove}
                today={today}
                onOpen={onOpen}
                onPick={setPicked}
                onShowDay={onShowDay}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? (
            <EntryLook
              entry={active.entry}
              timeZone={timeZone}
              className="shadow-overlay"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <section
        aria-labelledby="picked-day"
        className="flex flex-col gap-2 sm:hidden"
      >
        <h2 id="picked-day" className="text-section text-foreground">
          {longDayName(pickedDay)}
        </h2>
        {pickedEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing scheduled or published on this day.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pickedEntries.map((entry) => (
              <li key={`${entry.id}-${entry.platform}`}>
                <button
                  type="button"
                  onClick={() => onOpen(entry, pickedDay)}
                  className="w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <EntryLook entry={entry} timeZone={timeZone} roomy />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** The pointer's day when there is a pointer; the most covered day for the keyboard. */
const collisionDetection: CollisionDetection = (args) => {
  const under = pointerWithin(args);
  return under.length > 0 ? under : rectIntersection(args);
};

function DayCell({
  day,
  inMonth,
  isToday,
  isPicked,
  takesMoves,
  entries,
  timeZone,
  canMove,
  today,
  onOpen,
  onPick,
  onShowDay,
}: {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  isPicked: boolean;
  takesMoves: boolean;
  entries: CalendarEntry[];
  timeZone: string;
  canMove: boolean;
  today: string;
  onOpen: (entry: CalendarEntry, day: string) => void;
  onPick: (day: string) => void;
  onShowDay: (day: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day,
    disabled: !takesMoves,
  });
  const shown = entries.slice(0, SHOWN_PER_DAY);
  const more = entries.length - shown.length;
  const name = longDayName(day);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-16 flex-col gap-1 border-r border-b border-border p-1 sm:min-h-28 sm:p-1.5",
        !inMonth && "bg-surface-inset",
        isOver && "bg-accent ring-2 ring-ring ring-inset",
      )}
    >
      <span
        aria-current={isToday ? "date" : undefined}
        className={cn(
          "num flex size-6 items-center justify-center self-end rounded-full text-xs",
          inMonth ? "text-foreground" : "text-muted-foreground",
          isToday && "bg-primary text-primary-foreground",
        )}
      >
        <span aria-hidden>{Number(day.slice(8))}</span>
        <span className="sr-only">{name}</span>
      </span>

      {inMonth && (
        <>
          {/* Under 640 px a day is a button that shows its articles beneath the grid. */}
          <button
            type="button"
            onClick={() => onPick(day)}
            aria-label={`${name}: ${entries.length === 1 ? "1 article" : `${entries.length} articles`}`}
            aria-pressed={isPicked}
            className={cn(
              "absolute inset-0 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:hidden",
              isPicked && "ring-2 ring-ring ring-inset",
            )}
          />
          {entries.length > 0 && (
            <span aria-hidden className="flex justify-center gap-0.5 sm:hidden">
              {shown.map((entry) => (
                <span
                  key={`${entry.id}-${entry.platform}`}
                  className={cn(
                    "size-1.5 rounded-full",
                    entry.status === "scheduled"
                      ? "bg-info-600"
                      : "bg-muted-foreground",
                  )}
                />
              ))}
            </span>
          )}
          <ul className="hidden flex-col gap-1 sm:flex">
            {shown.map((entry) => (
              <li key={`${entry.id}-${entry.platform}`}>
                <EntryChip
                  entry={entry}
                  day={day}
                  timeZone={timeZone}
                  movable={
                    canMove && entry.status === "scheduled" && day >= today
                  }
                  onOpen={onOpen}
                />
              </li>
            ))}
          </ul>
          {more > 0 && (
            <button
              type="button"
              onClick={() => onShowDay(day)}
              className="hidden self-start rounded-sm px-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              {more} more
            </button>
          )}
        </>
      )}
    </div>
  );
}

function EntryChip({
  entry,
  day,
  timeZone,
  movable,
  onOpen,
}: {
  entry: CalendarEntry;
  day: string;
  timeZone: string;
  movable: boolean;
  onOpen: (entry: CalendarEntry, day: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${entry.id}:${entry.platform}`,
    data: { entry, day } satisfies DragData,
    disabled: !movable,
  });
  const time = timeIn(entry.date, timeZone);
  const state = entry.status === "scheduled" ? "scheduled" : "published";

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(movable ? { ...attributes, ...listeners } : {})}
      onClick={() => onOpen(entry, day)}
      aria-label={`${entry.title || "Untitled"}, ${state} at ${time}`}
      className={cn(
        "block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        movable && "cursor-grab touch-manipulation active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <EntryLook entry={entry} timeZone={timeZone} />
    </button>
  );
}

/** An entry's face: its time and title, tinted while it is still to come. */
function EntryLook({
  entry,
  timeZone,
  roomy = false,
  className,
}: {
  entry: CalendarEntry;
  timeZone: string;
  /** The phone's list beneath the grid: the whole title, on more lines. */
  roomy?: boolean;
  className?: string;
}) {
  const scheduled = entry.status === "scheduled";
  return (
    <span
      className={cn(
        "flex min-w-0 items-baseline gap-1.5 rounded-sm border text-xs",
        roomy ? "px-3 py-2 text-sm" : "px-1.5 py-1",
        scheduled
          ? "border-info-200 bg-info-50 text-info-700"
          : "border-border bg-surface-raised text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "num shrink-0",
          scheduled ? "text-info-700" : "text-muted-foreground",
        )}
      >
        {timeIn(entry.date, timeZone)}
      </span>
      <span className={cn("min-w-0", roomy ? "wrap-break-word" : "truncate")}>
        {entry.title || "Untitled"}
      </span>
      {roomy && (
        <span className="ml-auto shrink-0 text-muted-foreground">
          {scheduled ? "Scheduled" : "Published"}
        </span>
      )}
    </span>
  );
}
