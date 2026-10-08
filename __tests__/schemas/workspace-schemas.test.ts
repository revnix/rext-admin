/**
 * The create form's time zone is the browser's own, sent unseen. A zone the browser reports must
 * pass, or the form refuses to submit with nothing on screen (D22: a browser on UTC, or on an alias
 * like Asia/Calcutta, couldn't create a workspace).
 */

import {
  DESCRIPTION_HELP,
  DESCRIPTION_LIMITS,
  isTimeZone,
  normalizeWebsite,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";

const form = (timezone?: string) => ({
  from: "website" as const,
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
      workspaceFormSchema.parse({
        from: "website",
        name: "My company",
        url: typed,
      }).url,
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
      from: "website",
      name: "My company",
      url: typed,
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.find((issue) => issue.path[0] === "url")?.message,
    ).toBe("Enter your website's address, like yoursite.com");
  });
});

/**
 * A workspace made without a website (rext-control#853): the business is described instead, and
 * only the field of the way chosen is checked.
 */
describe("the workspace form, from a description of the business", () => {
  const described = (description: string, url = "") => ({
    from: "description" as const,
    name: "Acme Forge",
    url,
    description,
  });
  const SAID =
    "We sell hand-forged kitchen knives to home cooks who want one that lasts.";

  it("takes a sentence or two, trimmed, and needs no website", () => {
    const result = workspaceFormSchema.safeParse(described(`  ${SAID}  `));
    expect(result.success).toBe(true);
    expect(result.data?.description).toBe(SAID);
  });

  it("is not held up by what was left in the website field", () => {
    expect(
      workspaceFormSchema.safeParse(described(SAID, "not an address")).success,
    ).toBe(true);
  });

  it.each(["", "   ", "Knives.", "x".repeat(DESCRIPTION_LIMITS.min - 1)])(
    "asks for more than %j, in words that say what to write",
    (typed) => {
      const result = workspaceFormSchema.safeParse(described(typed));
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.find((issue) => issue.path[0] === "description")
          ?.message,
      ).toBe(DESCRIPTION_HELP);
    },
  );

  it("stops at the backend's limit", () => {
    expect(
      workspaceFormSchema.safeParse(
        described("x".repeat(DESCRIPTION_LIMITS.max)),
      ).success,
    ).toBe(true);
    const result = workspaceFormSchema.safeParse(
      described("x".repeat(DESCRIPTION_LIMITS.max + 1)),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Keep it to 1,000 characters or fewer",
    );
  });

  it("checks the website, not the description, on the website's way in", () => {
    expect(
      workspaceFormSchema.safeParse({
        from: "website",
        name: "Acme Forge",
        url: "acme-forge.com",
        description: "",
      }).success,
    ).toBe(true);
  });
});
