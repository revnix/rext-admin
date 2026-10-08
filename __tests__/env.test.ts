/**
 * @jest-environment node
 */

// env.ts runs its checks when it is first imported, so each case imports a
// fresh copy under the environment it describes.
const loadEnv = async (vars: Record<string, string>) => {
  const saved = process.env;
  process.env = { ...vars } as NodeJS.ProcessEnv;
  try {
    let loaded: unknown;
    await jest.isolateModulesAsync(async () => {
      loaded = (await import("@/env")).env;
    });
    return loaded;
  } finally {
    process.env = saved;
  }
};

const production = {
  NODE_ENV: "production",
  NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:2024",
  AUTH_SECRET: "test-secret",
};

describe("env", () => {
  it("accepts a production build with the backend's address and the session secret", async () => {
    await expect(loadEnv(production)).resolves.toBeDefined();
  });

  it("accepts either name of the session secret", async () => {
    const { AUTH_SECRET: _, ...vars } = production;
    await expect(
      loadEnv({ ...vars, NEXTAUTH_SECRET: "test-secret" }),
    ).resolves.toBeDefined();
  });

  it("names the session secret when a production build has neither name", async () => {
    const { AUTH_SECRET: _, ...vars } = production;
    await expect(loadEnv(vars)).rejects.toThrow(
      "AUTH_SECRET: The session secret is missing: set AUTH_SECRET or NEXTAUTH_SECRET",
    );
  });

  it("needs NEXT_PUBLIC_API_BASE_URL itself, which the auth pages read alone", async () => {
    const { NEXT_PUBLIC_API_BASE_URL: _, ...vars } = production;
    await expect(
      loadEnv({
        ...vars,
        NEXT_PUBLIC_BACKEND_API_URL: "http://127.0.0.1:2024",
      }),
    ).rejects.toThrow(
      "NEXT_PUBLIC_API_BASE_URL: The backend's address is missing: set NEXT_PUBLIC_API_BASE_URL",
    );
  });

  it("names a malformed address", async () => {
    await expect(
      loadEnv({ ...production, LANGGRAPH_API_URL: "not a url" }),
    ).rejects.toThrow("LANGGRAPH_API_URL");
  });

  it("still needs them for the staging deploy on Vercel", async () => {
    const { AUTH_SECRET: _, ...vars } = production;
    await expect(
      loadEnv({ ...vars, VERCEL_TARGET_ENV: "staging" }),
    ).rejects.toThrow("AUTH_SECRET");
  });

  it("lets a Vercel preview of a pull request build without them", async () => {
    await expect(
      loadEnv({ NODE_ENV: "production", VERCEL_TARGET_ENV: "preview" }),
    ).resolves.toBeDefined();
  });

  it("lets development run on the code's fallbacks", async () => {
    await expect(loadEnv({ NODE_ENV: "development" })).resolves.toBeDefined();
  });

  it("skips the checks when asked", async () => {
    await expect(
      loadEnv({ NODE_ENV: "production", SKIP_ENV_VALIDATION: "1" }),
    ).resolves.toBeDefined();
  });

  it.each(["0", "false"])(
    "keeps the checks on when the skip flag is %s",
    async (value) => {
      await expect(
        loadEnv({ NODE_ENV: "production", SKIP_ENV_VALIDATION: value }),
      ).rejects.toThrow("AUTH_SECRET");
    },
  );

  it("takes the support chat's two settings together, or neither (#711)", async () => {
    await expect(
      loadEnv({
        ...production,
        NEXT_PUBLIC_CRISP_WEBSITE_ID: "website",
        CRISP_TOKEN_SECRET: "secret",
      }),
    ).resolves.toBeDefined();
    await expect(
      loadEnv({ ...production, NEXT_PUBLIC_CRISP_WEBSITE_ID: "website" }),
    ).rejects.toThrow(
      "The support chat needs both NEXT_PUBLIC_CRISP_WEBSITE_ID and CRISP_TOKEN_SECRET, or neither",
    );
    await expect(
      loadEnv({ ...production, CRISP_TOKEN_SECRET: "secret" }),
    ).rejects.toThrow("or neither");
  });
});

// The key the server sends with its Google and GitHub sign-in call (revnix/rext-control#892): a
// value the backend would not take stops the build by name, instead of failing sign-ins later.
describe("DASHBOARD_SERVER_KEY", () => {
  it("is not needed: a build without it goes through", async () => {
    await expect(loadEnv(production)).resolves.toBeDefined();
  });

  it("takes a key of 32 characters or more", async () => {
    await expect(
      loadEnv({ ...production, DASHBOARD_SERVER_KEY: "a".repeat(64) }),
    ).resolves.toBeDefined();
    await expect(
      loadEnv({ ...production, DASHBOARD_SERVER_KEY: "a".repeat(32) }),
    ).resolves.toBeDefined();
  });

  it("names the setting when the key is cut short", async () => {
    await expect(
      loadEnv({ ...production, DASHBOARD_SERVER_KEY: "a".repeat(31) }),
    ).rejects.toThrow("DASHBOARD_SERVER_KEY");
  });

  it("does not count spaces around a key towards its length", async () => {
    await expect(
      loadEnv({
        ...production,
        DASHBOARD_SERVER_KEY: `  ${"a".repeat(20)}            `,
      }),
    ).rejects.toThrow("DASHBOARD_SERVER_KEY");
  });

  it("treats an empty value as not set", async () => {
    await expect(
      loadEnv({ ...production, DASHBOARD_SERVER_KEY: "" }),
    ).resolves.toBeDefined();
  });
});
