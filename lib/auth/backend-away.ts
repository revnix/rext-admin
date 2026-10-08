/**
 * A sign-in the backend gave no answer of its own to (revnix/rext-control#858): it is restarting,
 * which every backend deploy does for under a minute, or it can't be reached. The server's
 * sign-in reports it under this code, and the form says so and tries once more by itself. Nothing
 * here is about the person's email or password.
 */
export const BACKEND_AWAY_CODE = "BACKEND_AWAY";

/** The gateway's answers while the backend is away; a 500 is the backend's own. */
export const isGatewayAway = (status: number) =>
  status === 502 || status === 503 || status === 504;

/** How long the server's sign-in waits for the backend's answer before calling it away. */
export const SIGN_IN_ANSWER_WITHIN_MS = 8000;

/** How long the form waits before its one further try. */
export const SIGN_IN_AGAIN_AFTER_MS = 4000;
