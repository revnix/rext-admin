import { isMonthlyVolumeAvailable } from "@/lib/generate-content/monthly-volume";

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
