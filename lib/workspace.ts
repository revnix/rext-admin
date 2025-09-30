import type { Workspace } from "@/types/workspace";

type WorkspaceWithName = Workspace & { name?: string | null };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const getWorkspaceDisplayTitle = (
  workspace: Workspace | WorkspaceWithName | null | undefined,
  fallback = "Workspace",
) => {
  if (!workspace) {
    return fallback;
  }

  if ("name" in workspace && isNonEmptyString(workspace.name)) {
    return workspace.name.trim();
  }

  if (isNonEmptyString(workspace.title)) {
    return workspace.title.trim();
  }

  return fallback;
};
