import fs from "node:fs";
import path from "node:path";

// The smoke test a deploy ends with (task FB2.34): where it runs in the deploy workflow, and what its
// specs may do on a live dashboard.
const ROOT = path.resolve(__dirname, "../..");
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

/** A GitHub Actions expression, built so that the linter doesn't read it as a template's placeholder. */
const expression = (inner: string) => `$\{{ ${inner} }}`;

const workflow = read(".github/workflows/ci_cd.yaml");
const [, afterDeploy = ""] = workflow.split(/^ {2}deploy:\n/m);
const [deployJob = "", smokeJob = ""] = afterDeploy.split(/^ {2}smoke:\n/m);

describe("the deploy workflow's smoke job", () => {
  it("runs after the deploy, and no job waits for it", () => {
    expect(smokeJob).toMatch(/^ {4}needs: deploy$/m);
    expect(workflow.match(/needs:.*smoke/g)).toBeNull();
  });

  it("leaves the deploy job's steps as they were", () => {
    expect(deployJob).not.toMatch(/smoke|playwright|wait-for-deploy/);
    expect(deployJob.match(/npx vercel@latest deploy/g)).toHaveLength(2);
  });

  it("runs for the two deployed branches, each against its own address", () => {
    expect(smokeJob).toContain(
      "if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'",
    );
    expect(smokeJob).toContain(
      `SMOKE_BASE_URL: ${expression("github.ref == 'refs/heads/main' && 'https://app.rext.ai' || 'https://staging.rext.ai'")}`,
    );
    expect(smokeJob).toContain(
      `DEPLOY_TARGET: ${expression("github.ref == 'refs/heads/main' && 'production' || 'staging'")}`,
    );
  });

  it("gives the test itself three minutes and may read, not write, the repository", () => {
    const [, test = ""] = smokeJob.split("- name: Smoke test\n");
    expect(test).toMatch(/^ {8}timeout-minutes: 3$/m);
    expect(test).toContain(
      "run: pnpm exec playwright test -c playwright.smoke.config.ts",
    );
    expect(smokeJob).toMatch(
      /permissions:\n {6}contents: read\n {6}actions: read\n/,
    );
  });

  it("signs in only with a test account from the secrets, production's on main", () => {
    expect(smokeJob).toContain(
      `SMOKE_EMAIL: ${expression("github.ref == 'refs/heads/main' && secrets.SMOKE_EMAIL || secrets.SMOKE_STAGING_EMAIL")}`,
    );
    expect(smokeJob).toContain(
      `SMOKE_PASSWORD: ${expression("github.ref == 'refs/heads/main' && secrets.SMOKE_PASSWORD || secrets.SMOKE_STAGING_PASSWORD")}`,
    );
  });
});

describe("the smoke specs", () => {
  const signedOut = read("e2e/smoke/signed-out.spec.ts");
  const signedIn = read("e2e/smoke/signed-in.spec.ts");

  it("send nothing while signed out", () => {
    expect(signedOut).not.toMatch(/\.(click|fill|press|type|check)\(/);
  });

  it("type only the account and click only the sign-in button", () => {
    expect(signedIn.match(/\.fill\(/g)).toHaveLength(2);
    expect(signedIn.match(/\.click\(/g)).toHaveLength(1);
    expect(signedIn).toContain(
      'page.getByRole("button", { name: "Log in" }).click()',
    );
    expect(signedIn).not.toMatch(/\.(press|type|check)\(/);
  });

  it("skip the signed-in part without a test account", () => {
    expect(signedIn).toMatch(/test\.skip\(\s*!email \|\| !password,/);
  });

  it("are not retried and stay out of the accessibility run", () => {
    const config = read("playwright.smoke.config.ts");
    expect(config).toContain("retries: 0");
    expect(config).toContain('testDir: "e2e/smoke"');
    expect(config).toContain("globalTimeout: 150_000");
    expect(read("playwright.config.ts")).toContain('testIgnore: "**/smoke/**"');
  });
});
