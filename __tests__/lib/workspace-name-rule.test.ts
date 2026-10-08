/**
 * The workspace's name: what the backend accepts (rextaihq/rext-backend#1004), said by the form
 * first, and the name a skipped form gives (rext-control task 905).
 */

import {
  defaultWorkspaceName,
  WORKSPACE_NAME_CHARACTERS_MESSAGE,
  workspaceFormSchema,
  workspaceGeneralInfoSchema,
  workspaceNameSchema,
} from "@/schemas/workspace-schemas";

describe("what a workspace's name may hold", () => {
  it.each([
    "Luna Bakery",
    "Tom’s Bakery (UK)",
    "Acme: Blog – News!",
    "R&D #1",
    "Café @ Home!",
    "Ünïcode Köln 2026",
    "東京ベーカリー",
    "A+B / C_D | 50% * · • ™ ® ©",
    '"Quoted" and “curly”',
  ])("takes %s", (name) => {
    expect(workspaceNameSchema.safeParse(name).success).toBe(true);
  });

  it.each([
    "<b>Acme</b>",
    "Acme {beta}",
    "Acme \\ Co",
    "Acme $ale",
    "Acme ^ Co",
    "Acme ~ Co",
    "Acme = Co",
    "Acme `beta`",
    "Acme\u0007Co",
  ])("refuses %s in the backend's own sentence", (name) => {
    const result = workspaceNameSchema.safeParse(name);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      WORKSPACE_NAME_CHARACTERS_MESSAGE,
    );
  });

  it("says the same on the create form and in the workspace's settings", () => {
    const created = workspaceFormSchema.safeParse({
      from: "website",
      name: "<b>Acme</b>",
      url: "https://example.com",
    });
    expect(created.success).toBe(false);
    const renamed = workspaceGeneralInfoSchema.safeParse({
      name: "<b>Acme</b>",
      slug: "acme",
      url: "",
    });
    expect(renamed.success).toBe(false);
    expect(renamed.error?.issues[0]?.message).toBe(
      WORKSPACE_NAME_CHARACTERS_MESSAGE,
    );
  });
});

describe("the name a skipped form gives", () => {
  it("is the person's own first name", () => {
    expect(defaultWorkspaceName({ full_name: "Ana Silva" })).toBe(
      "Ana's workspace",
    );
    expect(
      defaultWorkspaceName({ display_name: "Tomás", full_name: "Tomás Ruiz" }),
    ).toBe("Tomás's workspace");
  });

  it.each([
    [null],
    [undefined],
    [{}],
    [{ full_name: "   " }],
    // An address, or anything the name rule would refuse, is not a name.
    [{ name: "ana@example.com" }],
    [{ full_name: "<script>" }],
    [{ full_name: "12345" }],
  ])("is My workspace for %p", (person) => {
    expect(defaultWorkspaceName(person)).toBe("My workspace");
  });

  it("always passes the name rule", () => {
    for (const person of [
      null,
      { full_name: "Ana Silva" },
      { full_name: "O’Brien Family" },
      { full_name: "x".repeat(300) },
    ]) {
      expect(
        workspaceNameSchema.safeParse(defaultWorkspaceName(person)).success,
      ).toBe(true);
    }
  });
});
