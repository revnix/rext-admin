export const BACKGROUND_GENERATION_RESTORE_EVENT =
  "rext:background-generation-restore";
export const BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY =
  "rext-background-generation-removal";

export interface BackgroundGenerationRestoreDetail {
  threadId: string;
}

export const requestBackgroundGenerationRestore = (threadId: string) => {
  window.dispatchEvent(
    new CustomEvent<BackgroundGenerationRestoreDetail>(
      BACKGROUND_GENERATION_RESTORE_EVENT,
      {
        detail: { threadId },
      },
    ),
  );
};

export const announceBackgroundGenerationRemoval = (
  threadIds: string[],
  options: { redirectUrl?: string } = {},
) => {
  if (threadIds.length === 0) return;

  localStorage.setItem(
    BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY,
    JSON.stringify({
      threadIds,
      removedAt: new Date().toISOString(),
      ...options,
    }),
  );
};
