/**
 * The create form's time zone is the browser's own, sent unseen. A zone the browser reports must
 * pass, or the form refuses to submit with nothing on screen (D22: a browser on UTC, or on an alias
 * like Asia/Calcutta, couldn't create a workspace).
 */

import {
  isTimeZone,
  normalizeWebsite,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";

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

describe("the website, as people type it (rext-control#854)", () => {
  it.each([
    ["mysite.com", "https://mysite.com"],
    ["www.mysite.com", "https://www.mysite.com"],
    ["http://mysite.com", "https://mysite.com"],
    ["https://mysite.com", "https://mysite.com"],
    ["https://mysite.com/", "https://mysite.com"],
    ["  MySite.COM  ", "https://mysite.com"],
    ["HTTP://WWW.MySite.com/Shop", "https://www.mysite.com/Shop"],
    ["mysite.com/blog/", "https://mysite.com/blog/"],
    ["mysite.co.uk", "https://mysite.co.uk"],
    ["shop.mysite.com?ref=1", "https://shop.mysite.com/?ref=1"],
  ])("takes %s as %s", (typed, read) => {
    expect(normalizeWebsite(typed)).toBe(read);
    expect(
      workspaceFormSchema.parse({ name: "My company", url: typed }).url,
    ).toBe(read);
  });

  it.each([
    "",
    "   ",
    "mysite",
    "https://mysite",
    "my site.com",
    "me@mysite.com",
    "ftp://mysite.com",
    "localhost",
    "just some words",
  ])("has no address in %j, and says what to type", (typed) => {
    expect(normalizeWebsite(typed)).toBeNull();
    const result = workspaceFormSchema.safeParse({
      name: "My company",
      url: typed,
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.find((issue) => issue.path[0] === "url")?.message,
    ).toBe("Enter your website's address, like yoursite.com");
  });
});
