/**
 * The calendar (D9): a scheduled article moves to another day and nothing else changes; a published
 * one stays put; the days are the account's timezone's; a refused move puts the article back.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  dateIn,
  gridDays,
  knownTimeZone,
  shiftMonth,
  todayIn,
} from "@/components/calendar/calendar-dates";
import { CalendarItemSheet } from "@/components/calendar/calendar-item-sheet";
import { MonthGrid } from "@/components/calendar/month-grid";
import { moveCalendarEntry, useRescheduleContent } from "@/hooks/use-content";
import type { CalendarEntry, CalendarResponse } from "@/types/content";

jest.mock("@/lib/api-client", () => ({
  apiClient: { content: { reschedule: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const reschedule = jest.requireMock("@/lib/api-client").apiClient.content
  .reschedule as jest.Mock;
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

const scheduled: CalendarEntry = {
  id: "a",
  title: "How to plan a content calendar",
  status: "scheduled",
  platform: "wordpress",
  date: "2026-10-20T09:00:00+00:00",
};
const published: CalendarEntry = {
  id: "b",
  title: "Keyword research for small sites",
  status: "published",
  platform: "wordpress",
  date: "2026-10-05T14:30:00+00:00",
  url: "https://example.com/keyword-research",
};

function october(): CalendarResponse {
  return {
    calendar: { "2026-10-05": [published], "2026-10-20": [scheduled] },
    total_items: 2,
    timezone: "UTC",
  };
}

describe("the calendar's days", () => {
  it("shows whole weeks from Sunday", () => {
    const days = gridDays("2026-10");
    // 1 October 2026 is a Thursday and the 31st a Saturday.
    expect(days[0]).toBe("2026-09-27");
    expect(days.at(-1)).toBe("2026-10-31");
    expect(days).toHaveLength(35);
  });

  it("counts today in the account's timezone", () => {
    // 21:00 UTC on 31 October is 02:00 on 1 November in Karachi.
    const late = new Date("2026-10-31T21:00:00Z");
    expect(todayIn("Asia/Karachi", late)).toBe("2026-11-01");
    expect(todayIn("UTC", late)).toBe("2026-10-31");
  });

  it("names an instant's day on the account's calendar, as the board does", () => {
    // 20:00 UTC on 30 September is already 1 October in Karachi.
    expect(dateIn("2026-09-30T20:00:00Z", "Asia/Karachi")).toMatch(/Oct 1/);
    expect(dateIn("2026-09-30T20:00:00Z", "UTC")).toMatch(/Sep 30/);
  });

  it("reads an unknown timezone as UTC, as the backend does", () => {
    expect(knownTimeZone("Not/A_Zone")).toBe("UTC");
    expect(knownTimeZone(undefined)).toBe("UTC");
    expect(knownTimeZone("Asia/Karachi")).toBe("Asia/Karachi");
  });

  it("steps across a year", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("moving an entry in a month", () => {
  it("moves a scheduled entry to its new day", () => {
    const moved = moveCalendarEntry(october(), "a", "2026-10-20", "2026-10-22");
    expect(moved.calendar["2026-10-20"]).toBeUndefined();
    expect(moved.calendar["2026-10-22"]).toEqual([scheduled]);
    expect(moved.calendar["2026-10-05"]).toEqual([published]);
    expect(moved.total_items).toBe(2);
  });

  it("leaves a published entry where it is", () => {
    const data = october();
    expect(moveCalendarEntry(data, "b", "2026-10-05", "2026-10-22")).toBe(data);
  });

  it("takes an entry moved to another month out of this one", () => {
    const moved = moveCalendarEntry(october(), "a", "2026-10-20", "2026-11-03");
    expect(moved.calendar["2026-11-03"]).toBeUndefined();
    expect(moved.calendar["2026-10-20"]).toBeUndefined();
    expect(moved.total_items).toBe(1);
  });
});

describe("the month grid", () => {
  const props = {
    month: "2026-10",
    calendar: october().calendar,
    today: "2026-10-10",
    timeZone: "UTC",
    onMove: jest.fn(),
    onShowDay: jest.fn(),
  };

  it("lets a scheduled article be dragged, and never a published one", () => {
    render(<MonthGrid {...props} canMove onOpen={jest.fn()} />);
    const toCome = screen.getByRole("button", {
      name: /How to plan a content calendar, scheduled at/,
    });
    const done = screen.getByRole("button", {
      name: /Keyword research for small sites, published at/,
    });
    expect(toCome).toHaveAttribute("aria-roledescription", "draggable");
    expect(done).not.toHaveAttribute("aria-roledescription");
  });

  it("lets nothing be dragged without the publish permission", () => {
    render(<MonthGrid {...props} canMove={false} onOpen={jest.fn()} />);
    expect(
      screen.getByRole("button", {
        name: /How to plan a content calendar, scheduled at/,
      }),
    ).not.toHaveAttribute("aria-roledescription");
  });

  it("opens an article's details on a click", async () => {
    const onOpen = jest.fn();
    render(<MonthGrid {...props} canMove onOpen={onOpen} />);
    await userEvent.click(
      screen.getByRole("button", {
        name: /Keyword research for small sites, published at/,
      }),
    );
    expect(onOpen).toHaveBeenCalledWith(published, "2026-10-05");
  });
});

describe("an item's sheet", () => {
  const props = {
    workspaceSlug: "acme",
    today: "2026-10-10",
    timeZone: "UTC",
    cancelling: false,
    onClose: jest.fn(),
    onCancelSchedule: jest.fn(),
  };

  it("moves a scheduled article to the day picked, and offers no earlier day", async () => {
    const onMove = jest.fn();
    render(
      <CalendarItemSheet
        {...props}
        item={{ entry: scheduled, day: "2026-10-20" }}
        canMove
        onMove={onMove}
      />,
    );
    expect(
      screen.getByRole("button", { name: /October 9th, 2026|October 9/ }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: /October 23rd, 2026|October 23/ }),
    );
    expect(onMove).toHaveBeenCalledWith(scheduled, "2026-10-20", "2026-10-23");
  });

  it("offers no move for a published article", () => {
    render(
      <CalendarItemSheet
        {...props}
        item={{ entry: published, day: "2026-10-05" }}
        canMove
        onMove={jest.fn()}
      />,
    );
    expect(screen.queryByText("Move to another day")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel schedule" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View on the site/ }),
    ).toHaveAttribute("href", published.url);
  });
});

describe("moving a schedule", () => {
  function setup() {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    client.setQueryData(["content-calendar", "ws-1", 2026, 10], october());
    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }
    return { client, wrapper };
  }

  beforeEach(() => {
    reschedule.mockReset();
    toast.error.mockReset();
  });

  it("asks the backend for the new day only", async () => {
    reschedule.mockResolvedValue({ content_id: "a", status: "scheduled" });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRescheduleContent(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        workspaceId: "ws-1",
        contentId: "a",
        fromDay: "2026-10-20",
        toDay: "2026-10-22",
      }),
    );
    expect(reschedule).toHaveBeenCalledWith("ws-1", "a", "2026-10-22");
  });

  it("puts the article back on its day when the backend refuses", async () => {
    reschedule.mockRejectedValue(
      new Error("The new publish time must be in the future"),
    );
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useRescheduleContent(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({
          workspaceId: "ws-1",
          contentId: "a",
          fromDay: "2026-10-20",
          toDay: "2026-10-22",
        })
        .catch(() => undefined);
    });
    const data = client.getQueryData<CalendarResponse>([
      "content-calendar",
      "ws-1",
      2026,
      10,
    ]);
    expect(data?.calendar["2026-10-20"]).toEqual([scheduled]);
    expect(data?.calendar["2026-10-22"]).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith(
      "The new publish time must be in the future",
    );
  });
});
