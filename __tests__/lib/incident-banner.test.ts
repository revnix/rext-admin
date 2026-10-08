import { shownBanner } from "@/lib/incident-banner";

const NOW = Date.parse("2026-10-08T06:00:00Z");
const banner = (changes: Record<string, unknown> = {}) => ({
  active: true,
  message: "Article writing is slower than usual. We're working on it.",
  areas: ["generation"],
  started_at: "2026-10-08T05:30:00Z",
  expires_at: "2026-10-08T06:30:00Z",
  ...changes,
});

describe("shownBanner", () => {
  it("shows the message, what is affected in the reader's words, and when it ends", () => {
    expect(
      shownBanner(banner({ areas: ["publishing", "generation"] }), NOW),
    ).toEqual({
      message: "Article writing is slower than usual. We're working on it.",
      // In the dashboard's own order, whatever order the backend sent.
      affected: "writing articles, publishing",
      until: Date.parse("2026-10-08T06:30:00Z"),
    });
  });

  it("shows nothing when there is no banner", () => {
    expect(shownBanner(banner({ active: false }), NOW)).toBeNull();
    expect(
      shownBanner(
        { active: false, message: null, areas: [], expires_at: null },
        NOW,
      ),
    ).toBeNull();
  });

  it("shows nothing for an answer that isn't a banner", () => {
    for (const answer of [
      undefined,
      null,
      "down for maintenance",
      42,
      [],
      {},
      { active: "true", message: "x" },
      banner({ message: null }),
      banner({ message: 7 }),
      banner({ message: "   \n " }),
    ]) {
      expect(shownBanner(answer, NOW)).toBeNull();
    }
  });

  it("ends at the banner's own end time, even when the last answer is kept", () => {
    const kept = banner();
    expect(
      shownBanner(kept, Date.parse("2026-10-08T06:29:59Z")),
    ).not.toBeNull();
    expect(shownBanner(kept, Date.parse("2026-10-08T06:30:00Z"))).toBeNull();
  });

  it("still shows a banner whose end time it can't read", () => {
    expect(shownBanner(banner({ expires_at: null }), NOW)?.until).toBeNull();
    expect(shownBanner(banner({ expires_at: "soon" }), NOW)?.until).toBeNull();
  });

  it("keeps the message to one run of plain text within the limit", () => {
    const shown = shownBanner(
      banner({ message: `  Writing\n\n is   slow. ${"x".repeat(400)}` }),
      NOW,
    );
    expect(shown?.message.startsWith("Writing is slow. xxx")).toBe(true);
    expect(shown?.message).toHaveLength(280);
  });

  it("leaves out areas it doesn't know, and names none when none is left", () => {
    expect(
      shownBanner(banner({ areas: ["the_weather", "billing", 7] }), NOW)
        ?.affected,
    ).toBe("billing");
    expect(shownBanner(banner({ areas: [] }), NOW)?.affected).toBeNull();
    expect(
      shownBanner(banner({ areas: "generation" }), NOW)?.affected,
    ).toBeNull();
  });
});
