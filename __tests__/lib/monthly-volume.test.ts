import {
  describeMonthlyVolume,
  formatCompactVolume,
  isMonthlyVolumeAvailable,
} from "@/lib/generate-content/monthly-volume";

describe("isMonthlyVolumeAvailable", () => {
  it.each([1200, 0, "1200", "1,200", "0"])("accepts %p", (value) => {
    expect(isMonthlyVolumeAvailable(value)).toBe(true);
  });

  it.each([null, undefined, "", "   ", "N/A", Number.NaN, Infinity])(
    "rejects %p",
    (value) => {
      expect(isMonthlyVolumeAvailable(value)).toBe(false);
    },
  );
});

describe("describeMonthlyVolume", () => {
  it.each([
    [1200, "ok", 1200],
    ["1,200", undefined, 1200],
    [35, null, 35],
  ])("shows %p (%p) as a number", (volume, status, expected) => {
    expect(describeMonthlyVolume(volume, status)).toEqual({
      kind: "volume",
      volume: expected,
    });
  });

  it.each([
    [0, "ok", "No search data"],
    [0, undefined, "No search data"],
    [null, undefined, "No search data"],
    [null, "no_data", "No search data"],
    [null, "lookup_failed", "Lookup failed"],
    [null, "insufficient_credits", "Not enough credits"],
    // a status other than ok wins over a stale number
    [500, "lookup_failed", "Lookup failed"],
    // an unknown status falls back to the number, then to no data
    [500, "something_new", null],
    [null, "something_new", "No search data"],
  ])("explains %p (%p)", (volume, status, label) => {
    const display = describeMonthlyVolume(volume, status);
    if (label === null) {
      expect(display).toEqual({ kind: "volume", volume: 500 });
    } else {
      expect(display).toMatchObject({ kind: "message", label });
    }
  });
});

describe("formatCompactVolume", () => {
  it.each([
    [7, "7"],
    [1200, "1.2K"],
    [3_400_000, "3.4M"],
  ])("formats %p as %p", (value, text) => {
    expect(formatCompactVolume(value)).toBe(text);
  });
});
