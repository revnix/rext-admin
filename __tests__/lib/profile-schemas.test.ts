/**
 * Account settings, Profile (D6): the rules the form checks before a save. The backend stores any
 * timezone string, and scheduled publishing reads it, so only real IANA names pass.
 */

import { isTimeZone, profileSchema } from "@/schemas/profile-schemas";

const valid = {
  full_name: "Ada Lovelace",
  display_name: "",
  bio: "",
  timezone: "Asia/Karachi",
};

function errorsFor(values: Partial<typeof valid>) {
  const result = profileSchema.safeParse({ ...valid, ...values });
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
}

describe("isTimeZone", () => {
  it.each(["UTC", "Asia/Karachi", "America/New_York", "Europe/London"])(
    "knows %s",
    (zone) => {
      expect(isTimeZone(zone)).toBe(true);
    },
  );

  it.each(["", "Mars/Olympus", "GMT+25", "not a zone"])(
    "refuses %p",
    (zone) => {
      expect(isTimeZone(zone)).toBe(false);
    },
  );
});

describe("profileSchema", () => {
  it("accepts a filled profile with no display name", () => {
    expect(errorsFor({})).toEqual({});
  });

  it("refuses a timezone the scheduler couldn't read", () => {
    expect(errorsFor({ timezone: "Somewhere/Else" }).timezone).toBe(
      "Choose a timezone from the list",
    );
  });

  it("takes a display name of two characters or none", () => {
    expect(errorsFor({ display_name: "A" }).display_name).toMatch(
      /at least 2 characters/,
    );
    expect(errorsFor({ display_name: "  " }).display_name).toBeUndefined();
  });

  it("takes names in any script, but no digits", () => {
    expect(errorsFor({ full_name: "محمد علی" })).toEqual({});
    expect(errorsFor({ full_name: "Agent 47" }).full_name).toMatch(/numbers/);
  });

  it("holds the bio to the backend's 500 characters", () => {
    expect(errorsFor({ bio: "a".repeat(501) }).bio).toMatch(/500/);
  });
});
