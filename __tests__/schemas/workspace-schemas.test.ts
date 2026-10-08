/**
 * The create form's time zone is the browser's own, sent unseen. A zone the browser reports must
 * pass, or the form refuses to submit with nothing on screen (D22: a browser on UTC, or on an alias
 * like Asia/Calcutta, couldn't create a workspace).
 */

import {
  DESCRIPTION_HELP,
  DESCRIPTION_LIMITS,
  isDefaultWorkspaceName,
  isTimeZone,
  normalizeWebsite,
  WORKSPACE_NAME_CHARACTERS_MESSAGE,
  workspaceFormSchema,
  workspaceSetupFormSchema,
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

/**
 * Setting up a workspace that is there already (rext-control task 922): with a description the
 * form asks what the business is called, since a description often names none. The create form
 * asks the same as the workspace's name, so its own schema needs no second answer.
 */
describe("the set-up form, from a description of the business", () => {
  const SAID =
    "We sell hand-forged kitchen knives to home cooks who want one that lasts.";
  const described = (business?: string) => ({
    from: "description" as const,
    name: "Ana's workspace",
    url: "",
    description: SAID,
    business,
  });
  const refusal = (business?: string) =>
    workspaceSetupFormSchema
      .safeParse(described(business))
      .error?.issues.find((issue) => issue.path[0] === "business")?.message;

  it("takes the business's name, trimmed", () => {
    const result = workspaceSetupFormSchema.safeParse(
      described("  Acme Forge  "),
    );
    expect(result.success).toBe(true);
    expect(result.data?.business).toBe("Acme Forge");
  });

  it.each([undefined, "", "   "])("asks for it when it is %j", (typed) => {
    expect(refusal(typed)).toBe("Name is required");
  });

  it("holds it to the workspace name's characters and the backend's length", () => {
    expect(refusal("<b>Acme</b>")).toBe(WORKSPACE_NAME_CHARACTERS_MESSAGE);
    expect(refusal("x".repeat(256))).toBe(
      "Name must be 255 characters or less",
    );
    expect(refusal("x".repeat(255))).toBeUndefined();
  });

  it("does not ask for it with a website, which names its own brand", () => {
    expect(
      workspaceSetupFormSchema.safeParse({
        from: "website",
        name: "Ana's workspace",
        url: "acme-forge.com",
        description: "",
        business: "",
      }).success,
    ).toBe(true);
  });

  it("is not asked for by the create form, whose name is the answer", () => {
    expect(workspaceFormSchema.safeParse(described()).success).toBe(true);
  });
});

describe("a name the skip gave a workspace", () => {
  it.each([
    "My workspace",
    "Ana's workspace",
    "Ana’s workspace",
    " José's workspace ",
  ])("is known for one: %j", (name) => {
    expect(isDefaultWorkspaceName(name)).toBe(true);
  });

  it.each([
    "Luna Bakery",
    "Workspace tools",
    "Ana's Bakery",
    "My workspace shop",
  ])("is not taken for %j", (name) => {
    expect(isDefaultWorkspaceName(name)).toBe(false);
  });
});
