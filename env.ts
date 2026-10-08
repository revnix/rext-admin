import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * The environment variables the dashboard reads, validated when Next.js loads
 * `next.config.ts` (it imports this file), so `next dev` and `next build` stop
 * on a malformed value and a production build stops on a missing one, naming
 * the variable.
 *
 * Every name is optional on its own, as the code reading it has a fallback.
 * A production build needs two things the fallbacks don't cover: the backend's
 * address as NEXT_PUBLIC_API_BASE_URL, and the session secret under either of
 * its two names (`createFinalSchema` below). Vercel's previews of pull requests are the
 * exception: they are built without the deploys' variables, as they were before
 * this check. Set SKIP_ENV_VALIDATION=1 to build without them.
 *
 * Server names are readable on the server only; NEXT_PUBLIC_ names are compiled
 * into the browser's code, so a secret never takes that prefix.
 */
const optional = z.string().optional();
const optionalUrl = z.url().optional();

const server = {
  AUTH_SECRET: optional,
  NEXTAUTH_SECRET: optional,
  AUTH_URL: optional,
  NEXTAUTH_URL: optional,
  AUTH_TRUST_HOST: optional,
  AUTH_SESSION_MAX_AGE_DAYS: z
    .string()
    .regex(/^\d+$/, "a whole number of days")
    .optional(),
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  AUTH_GITHUB_ID: optional,
  AUTH_GITHUB_SECRET: optional,
  // The key this server sends with its Google and GitHub sign-in call (lib/auth/dashboard-server-key.ts);
  // the backend holds the same value and takes none under 32 characters, so a cut-off or mistyped
  // one stops the build here by name instead of failing sign-ins later. Unset, the call goes without it.
  DASHBOARD_SERVER_KEY: z
    .string()
    .trim()
    .min(32, "at least 32 characters, the same value as the backend's")
    .optional(),
  LANGGRAPH_API_URL: optionalUrl,
  LANGGRAPH_RUN_WEBHOOKS: optional,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
  // "1" serves the /dev pages in a production build: pr-checks only (lib/dev-pages.ts).
  REXT_DEV_PAGES: z.enum(["1"]).optional(),
  // The support chat's session-token secret (lib/support-chat/identity.ts); unset, no chat.
  CRISP_TOKEN_SECRET: optional,
};

const client = {
  NEXT_PUBLIC_API_BASE_URL: optionalUrl,
  NEXT_PUBLIC_BACKEND_API_URL: optionalUrl,
  NEXT_PUBLIC_LANGGRAPH_API_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optional,
  NEXT_PUBLIC_POSTHOG_KEY: optional,
  NEXT_PUBLIC_POSTHOG_HOST: optional,
  NEXT_PUBLIC_ANALYTICS_ENABLED: optional,
  // "true" records sessions, masked (lib/analytics-recording.ts); unset or anything else, none.
  NEXT_PUBLIC_SESSION_RECORDING: optional,
  // The Crisp website the support chat opens (lib/support-chat/chat.ts); unset, no chat.
  NEXT_PUBLIC_CRISP_WEBSITE_ID: optional,
};

// Production builds, the staging and production deploys among them; not a
// Vercel preview of a pull request (VERCEL_TARGET_ENV is "staging" for the
// staging deploy, "preview" only for those).
const needsDeployNames =
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL_TARGET_ENV !== "preview";

/** At least one of `names` is set: the code reads them as one value. */
const requireOneOf = (
  env: Record<string, unknown>,
  ctx: z.RefinementCtx,
  names: readonly string[],
  what: string,
) => {
  if (names.some((name) => env[name])) return;
  ctx.addIssue({
    code: "custom",
    path: [names[0]],
    message: `${what} is missing: set ${names.join(" or ")}`,
  });
};

export const env = createEnv({
  server,
  client,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
    NEXT_PUBLIC_LANGGRAPH_API_URL: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    NEXT_PUBLIC_SESSION_RECORDING: process.env.NEXT_PUBLIC_SESSION_RECORDING,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
  },
  createFinalSchema: (shape, isServer) =>
    z.object(shape).superRefine((values, ctx) => {
      // The support chat needs both: the website it opens and the secret its identity route
      // signs with. One alone would offer a chat that can never open (#711).
      if (
        isServer &&
        Boolean(values.NEXT_PUBLIC_CRISP_WEBSITE_ID) !==
          Boolean(values.CRISP_TOKEN_SECRET)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["CRISP_TOKEN_SECRET"],
          message:
            "The support chat needs both NEXT_PUBLIC_CRISP_WEBSITE_ID and CRISP_TOKEN_SECRET, or neither",
        });
      }
      if (!isServer || !needsDeployNames) return;
      // Not NEXT_PUBLIC_BACKEND_API_URL instead: the auth pages (forgot and
      // reset password, account recovery, email verification) and sign-out's
      // token revocation read NEXT_PUBLIC_API_BASE_URL alone.
      requireOneOf(
        values,
        ctx,
        ["NEXT_PUBLIC_API_BASE_URL"],
        "The backend's address",
      );
      requireOneOf(
        values,
        ctx,
        ["AUTH_SECRET", "NEXTAUTH_SECRET"],
        "The session secret",
      );
    }),
  onValidationError: (issues) => {
    const lines = issues.map((issue) => {
      const name =
        issue.path
          ?.map((key) => String(typeof key === "object" ? key.key : key))
          .join(".") || "(env)";
      return `  ${name}: ${issue.message}`;
    });
    throw new Error(`Invalid environment variables:\n${lines.join("\n")}`);
  },
  emptyStringAsUndefined: true,
  // Only the documented value: "0" or "false" must not switch the checks off.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
