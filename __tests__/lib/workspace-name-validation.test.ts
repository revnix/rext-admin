import {
  createWorkspaceRequestSchema,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";

const validWorkspace = { url: "https://example.com" };

describe("workspace name validation", () => {
  it.each(["Workspace 2026", "R&D #1", "Café @ Home!"])(
    "allows numbers and special characters when letters are present: %s",
    (name) => {
      expect(
        workspaceFormSchema.safeParse({ ...validWorkspace, name }).success,
      ).toBe(true);
      expect(
        createWorkspaceRequestSchema.safeParse({ ...validWorkspace, name })
          .success,
      ).toBe(true);
    },
  );

  it.each(["12345", "!@#$%^&*()", "    "])(
    "rejects workspace names without letters: %s",
    (name) => {
      expect(
        workspaceFormSchema.safeParse({ ...validWorkspace, name }).success,
      ).toBe(false);
    },
  );
});
