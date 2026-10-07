import type { WorkspaceData } from "@/types/workspace";
import type { Workspace } from "@/types/workspace";

type WorkspaceWithName = Workspace & { name?: string | null };
type WorkspaceLike = Workspace | WorkspaceWithName | WorkspaceData;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const getWorkspaceDisplayTitle = (
  workspace: WorkspaceLike | null | undefined,
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
