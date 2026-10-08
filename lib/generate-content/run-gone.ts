/**
 * A run the page is asked to open that isn't there (rext-control task 824): an address from another
 * account, an old or mistyped one, a run that was removed. The runtime answers "not found" for all
 * of them, with its own text ("HTTP 404: {"detail":"thread … not found"}"), which once reached the
 * page as it came. The `/api/generate/[threadId]/*` routes answer with a code and a sentence of
 * the app's own instead, and never pass a remote error's text on.
 */
export const RUN_NOT_FOUND = "run_not_found";
export const RUN_NOT_FOUND_MESSAGE =
  "This article's run is no longer here. Start a new one.";

/** The SDK puts the answer's status on its error. */
export const isRunGone = (error: unknown) =>
  (error as { status?: number })?.status === 404;

/** What a generate route answers for a run that isn't there, or isn't the caller's. */
export const runGoneResponse = () =>
  Response.json(
    { error: RUN_NOT_FOUND_MESSAGE, code: RUN_NOT_FOUND },
    { status: 404 },
  );

/**
 * The SDK's own error text is a status code and the remote body ("HTTP 500: {…}"): never words for
 * a person. A message that isn't in that shape is one of the app's own and is kept.
 */
const REMOTE_SHAPE = /^HTTP \d{3}\b/;

/** An error's message when it is the app's own sentence, else `fallback`. */
export function ownWords(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  return message && !REMOTE_SHAPE.test(message) ? message : fallback;
}

/** What the page says when a run can't be opened for a reason it can't name. */
export const RESTORE_FAILED_MESSAGE =
  "We couldn't open this article just now. Try again in a moment, or start a new one.";
