/**
 * The create form's time zone is the browser's own, sent unseen. A zone the browser reports must
 * pass, or the form refuses to submit with nothing on screen (D22: a browser on UTC, or on an alias
 * like Asia/Calcutta, couldn't create a workspace).
 */

import { isTimeZone, workspaceFormSchema } from "@/schemas/workspace-schemas";

const form = (timezone?: string) => ({
  name: "Acme",
  url: "https://acme.example",
  timezone,
});

describe("the workspace form's time zone", () => {
  it.each([
    "UTC",
    "Etc/UTC",
    "Asia/Calcutta",
    "Europe/Kiev",
    "America/New_York",
  ])("accepts %s", (tz) => {
    expect(isTimeZone(tz)).toBe(true);
    expect(workspaceFormSchema.safeParse(form(tz)).success).toBe(true);
  });

  it("accepts no time zone", () => {
    expect(workspaceFormSchema.safeParse(form(undefined)).success).toBe(true);
  });

  it("refuses a name that isn't a time zone", () => {
    expect(isTimeZone("Not/AZone")).toBe(false);
    expect(workspaceFormSchema.safeParse(form("Not/AZone")).success).toBe(
      false,
    );
  });
});
