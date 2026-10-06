import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/**
 * The calendar's days are plain dates, `YYYY-MM-DD`, counted in the account's timezone (the backend
 * groups the month in it and reads a picked day in it). These helpers never turn a day into an
 * instant: a day is parsed at local midnight only to name it and to step through the grid.
 */

/** A timezone the browser knows; anything else reads as UTC, as the backend does. */
export function knownTimeZone(timeZone: string | undefined): string {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** Today's date in a timezone, `YYYY-MM-DD`. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The month a day is in, `YYYY-MM`. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** The month before or after, `YYYY-MM`. */
export function shiftMonth(month: string, by: number): string {
  return format(addMonths(parseISO(`${month}-01`), by), "yyyy-MM");
}

/** Every day the month's grid shows, whole weeks from Sunday, `YYYY-MM-DD`. */
export function gridDays(month: string): string[] {
  const first = parseISO(`${month}-01`);
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(first)),
    end: endOfWeek(endOfMonth(first)),
  }).map((day) => format(day, "yyyy-MM-dd"));
}

/** The day `by` days after `day` (before, when negative), `YYYY-MM-DD`. */
export function shiftDay(day: string, by: number): string {
  return format(addDays(parseISO(day), by), "yyyy-MM-dd");
}

/** "October 2026". */
export function monthName(month: string): string {
  return format(parseISO(`${month}-01`), "MMMM yyyy");
}

/** "Mon 12 Oct". */
export function shortDayName(day: string): string {
  return format(parseISO(day), "EEE d MMM");
}

/** "Monday 12 October". */
export function longDayName(day: string): string {
  return format(parseISO(day), "EEEE d MMMM");
}

/** The time of day an entry publishes at, in the account's timezone: "9:00 AM". */
export function timeIn(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(instant));
}
