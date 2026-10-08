/**
 * @jest-environment node
 */

// The key the server sends with its Google and GitHub sign-in call (revnix/rext-control#892): a
// value the backend would not take stops the build by name, instead of failing sign-ins later.
// env.ts runs its checks when it is first imported, so each case imports a fresh copy.
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
