/**
 * One initials rule for every avatar (C12): the profile showed one letter where the sidebar
 * showed two for the same person.
 */

import { initials } from "@/lib/initials";

describe("initials", () => {
  it("takes the first letters of the first two words, upper case", () => {
    expect(initials("Sam Rivera")).toBe("SR");
    expect(initials("lena eriksen")).toBe("LE");
    expect(initials("Ana Maria de la Cruz")).toBe("AM");
  });

  it("takes one letter from a one-word name", () => {
    expect(initials("Lena")).toBe("L");
  });

  it("ignores extra spaces", () => {
    expect(initials("  Sam   Rivera ")).toBe("SR");
  });

  it("shows a question mark without a name", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
  });
});
