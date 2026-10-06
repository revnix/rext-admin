/**
 * The notifications drawer (D7) groups by day and links a notification only to a page inside the
 * app: the link it carries, or a finished article in a workspace the person has.
 */

import {
  dayLabel,
  groupByDay,
  notificationHref,
} from "@/components/notifications-drawer";
import type { OperationNotification } from "@/types/sse";

const now = new Date(2026, 9, 6, 15, 0);

const note = (
  id: string,
  createdAt: Date,
  metadata?: Record<string, unknown>,
): OperationNotification => ({
  id,
  title: "Generation Completed",
  message: `"Article ${id}" has finished generating.`,
  type: "info",
  createdAt: createdAt.toISOString(),
  read: false,
  metadata,
});

describe("dayLabel", () => {
  it("says today, yesterday, then the day", () => {
    expect(dayLabel(new Date(2026, 9, 6, 1, 0), now)).toBe("Today");
    expect(dayLabel(new Date(2026, 9, 5, 23, 59), now)).toBe("Yesterday");
    expect(dayLabel(new Date(2026, 9, 4, 12, 0), now)).toBe(
      "Sunday, October 4",
    );
    expect(dayLabel(new Date(2025, 11, 31, 12, 0), now)).toBe(
      "Wednesday, December 31, 2025",
    );
  });
});

describe("a malformed timestamp", () => {
  it("is grouped as Earlier instead of breaking the drawer", () => {
    expect(dayLabel(new Date("not a date"), now)).toBe("Earlier");
    const broken = { ...note("x", now), createdAt: "not a date" };
    expect(groupByDay([broken], now)).toEqual([
      { label: "Earlier", items: [broken] },
    ]);
  });
});

describe("groupByDay", () => {
  it("keeps the order and starts a group at each new day", () => {
    const groups = groupByDay(
      [
        note("a", new Date(2026, 9, 6, 14, 0)),
        note("b", new Date(2026, 9, 6, 9, 0)),
        note("c", new Date(2026, 9, 5, 18, 0)),
        note("d", new Date(2026, 9, 2, 8, 0)),
      ],
      now,
    );

    expect(groups.map((g) => [g.label, g.items.map((n) => n.id)])).toEqual([
      ["Today", ["a", "b"]],
      ["Yesterday", ["c"]],
      ["Friday, October 2", ["d"]],
    ]);
  });
});

describe("notificationHref", () => {
  const workspaces = [{ id: "ws-1", slug: "acme" }];

  it("follows a path inside the app", () => {
    expect(
      notificationHref(note("a", now, { href: "/w/acme/content" }), workspaces),
    ).toBe("/w/acme/content");
  });

  it("never follows an address outside the app", () => {
    for (const href of [
      "https://example.com",
      "//example.com/path",
      "/\\example.com/path",
    ]) {
      expect(notificationHref(note("a", now, { href }))).toBeNull();
    }
  });

  it("links a finished article in a workspace the person has", () => {
    expect(
      notificationHref(
        note("a", now, { contentId: "c-1", workspaceId: "ws-1" }),
        workspaces,
      ),
    ).toBe("/w/acme/content/c-1");
    expect(
      notificationHref(
        note("a", now, { contentId: "c-1", workspaceId: "ws-2" }),
        workspaces,
      ),
    ).toBeNull();
  });

  it("has no link without one", () => {
    expect(notificationHref(note("a", now), workspaces)).toBeNull();
  });
});
