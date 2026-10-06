import {
  createReducedMotionVariants,
  DURATION,
  stepChangeVariants,
} from "@/lib/animations";

describe("the motion presets (design/app-language.md §10)", () => {
  it("keeps the durations of the CSS tokens", () => {
    expect(DURATION).toEqual({ fast: 0.12, base: 0.2, slow: 0.32 });
  });

  it("fades a new step in over 200 ms and lets the old one go at once", () => {
    expect(stepChangeVariants.enter).toEqual({ opacity: 0 });
    expect(stepChangeVariants.center).toMatchObject({
      opacity: 1,
      transition: { duration: DURATION.base },
    });
    expect(stepChangeVariants.exit).toMatchObject({
      transition: { duration: 0 },
    });
  });

  it("shows the finished state at once under reduced motion", () => {
    const reduced = createReducedMotionVariants(stepChangeVariants);
    expect(reduced.center).toMatchObject({
      opacity: 1,
      transition: { duration: 0 },
    });
  });
});
