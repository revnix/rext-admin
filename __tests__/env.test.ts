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

  it("accepts either name of each", async () => {
    await expect(
      loadEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_BACKEND_API_URL: "http://127.0.0.1:2024",
        NEXTAUTH_SECRET: "test-secret",
      }),
    ).resolves.toBeDefined();
  });

  it("names the session secret when a production build has neither name", async () => {
    const { AUTH_SECRET: _, ...vars } = production;
    await expect(loadEnv(vars)).rejects.toThrow(
      "AUTH_SECRET: The session secret is missing: set AUTH_SECRET or NEXTAUTH_SECRET",
    );
  });

  it("names the backend's address when a production build has neither name", async () => {
    const { NEXT_PUBLIC_API_BASE_URL: _, ...vars } = production;
    await expect(loadEnv(vars)).rejects.toThrow(
      "set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL",
    );
  });

  it("names a malformed address", async () => {
    await expect(
      loadEnv({ ...production, LANGGRAPH_API_URL: "not a url" }),
    ).rejects.toThrow("LANGGRAPH_API_URL");
  });

  it("lets development run on the code's fallbacks", async () => {
    await expect(loadEnv({ NODE_ENV: "development" })).resolves.toBeDefined();
  });

  it("skips the checks when asked", async () => {
    await expect(
      loadEnv({ NODE_ENV: "production", SKIP_ENV_VALIDATION: "1" }),
    ).resolves.toBeDefined();
  });
});
