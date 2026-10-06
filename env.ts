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
 * address and the session secret, each under either of its two names
 * (`createFinalSchema` below). Set SKIP_ENV_VALIDATION=1 to build without them.
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
  LANGGRAPH_API_URL: optionalUrl,
  LANGGRAPH_RUN_WEBHOOKS: optional,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
};

const client = {
  NEXT_PUBLIC_API_BASE_URL: optionalUrl,
  NEXT_PUBLIC_BACKEND_API_URL: optionalUrl,
  NEXT_PUBLIC_LANGGRAPH_API_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optional,
  NEXT_PUBLIC_POSTHOG_KEY: optional,
  NEXT_PUBLIC_POSTHOG_HOST: optional,
  NEXT_PUBLIC_ANALYTICS_ENABLED: optional,
};

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
  },
  createFinalSchema: (shape, isServer) =>
    z.object(shape).superRefine((values, ctx) => {
      if (!isServer || process.env.NODE_ENV !== "production") return;
      requireOneOf(
        values,
        ctx,
        ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_BACKEND_API_URL"],
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
