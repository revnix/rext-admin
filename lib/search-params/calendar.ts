import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

/**
 * The calendar's lens and month as URL search params (`?view=board`, `?month=2026-11`), so a reload,
 * a shared link and Back keep them. The page reads them with `useQueryStates(calendarParams)`.
 */
export const CALENDAR_VIEWS = ["month", "board", "list"] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** A month as `YYYY-MM`; anything else reads as no month (the current one). */
const parseAsMonth = createParser({
  parse: (value) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : null),
  serialize: (value: string) => value,
});

export const calendarParams = {
  view: parseAsStringLiteral(CALENDAR_VIEWS).withDefault("month"),
  month: parseAsMonth,
};

export const loadCalendarParams = createLoader(calendarParams);
