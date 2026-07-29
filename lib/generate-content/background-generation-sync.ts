export const BACKGROUND_GENERATION_RESTORE_EVENT =
  "rext:background-generation-restore";

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
