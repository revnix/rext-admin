/**
 * The trial in the shell (F6): ending under three days or the low-balance credits, the pill's
 * words, and what the ending banner says first. The times are noon UTC, so the calendar days are
 * the same in any time zone from UTC−11 to UTC+11.
 */

import {
  trialEndingTitle,
  trialPillWords,
  trialState,
} from "@/components/billing/trial-state";

const now = new Date("2026-10-06T12:00:00Z");
const at = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
const state = (days: number, creditsLeft: number) => {
  const s = trialState(
    { trialEnd: at(days), creditsLeft, lowCredits: 15 },
    now,
  );
  if (!s) throw new Error("no state");
  return s;
};

describe("trialState", () => {
  it("is not ending on day 14 with the credits there", () => {
    const s = state(14, 50);
    expect(s).toMatchObject({ daysLeft: 14, ending: false, ended: false });
    expect(trialPillWords(s)).toBe("Trial · 14 days · 50 credits left");
  });

  it("is ending under three days", () => {
    expect(state(3, 35)).toMatchObject({ daysLeft: 3, ending: false });
    expect(state(2.9, 35)).toMatchObject({ daysLeft: 3, ending: true });
    expect(trialEndingTitle(state(2, 35), 15)).toBe(
      "Your trial ends in 2 days",
    );
  });

  it("is ending under the low-balance credits, and says so first", () => {
    const s = state(9, 14);
    expect(s.ending).toBe(true);
    expect(trialEndingTitle(s, 15)).toBe("14 credits left in your trial");
  });

  it("ends today in its last hours, tomorrow the day before, then has ended", () => {
    const today = state(0.1, 30);
    expect(trialEndingTitle(today, 15)).toBe("Your trial ends today");
    expect(trialPillWords(today)).toBe("Trial · ends today · 30 credits left");
    expect(trialEndingTitle(state(1, 30), 15)).toBe("Your trial ends tomorrow");
    const over = state(-0.1, 30);
    expect(over).toMatchObject({ daysLeft: 0, ended: true });
    expect(trialPillWords(over)).toBe("Trial ended");
  });

  it("says one day and one credit", () => {
    expect(trialPillWords(state(1, 1))).toBe("Trial · 1 day · 1 credit left");
  });

  it("knows nothing from a date it can't read", () => {
    expect(
      trialState({ trialEnd: "soon", creditsLeft: 1, lowCredits: 15 }, now),
    ).toBeNull();
  });
});
