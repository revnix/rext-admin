/** @jest-environment node */
import { execFile } from "node:child_process";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

// scripts/wait-for-deploy.mjs against a stand-in for Vercel's API and for the address's sign-in page: it
// goes on when the address serves a deployment made by this deploy, turns red when the build failed or
// the address never changes, and steps aside (a warning, no failure) when it can't read Vercel at all.
const SCRIPT = path.resolve(__dirname, "../../scripts/wait-for-deploy.mjs");
const SINCE = "2026-10-08T04:02:00Z";
const TOKEN = "token-that-must-not-be-printed";

type Deployment = {
  uid: string;
  state: string;
  source: string;
  target: string | null;
  meta?: { githubCommitRef?: string };
};
const cli = (
  uid: string,
  state: string,
  target: string | null,
): Deployment => ({
  uid,
  state,
  source: "cli",
  target,
});
const git = (
  uid: string,
  state: string,
  target: string | null,
  branch: string,
): Deployment => ({
  uid,
  state,
  source: "git",
  target,
  meta: { githubCommitRef: branch },
});

type Step = Deployment[] | number;

/** Vercel's answers in order (a list, or an error status), the last one repeated; and what is served. */
async function run(
  target: string,
  vercel: Step[],
  served: string[],
  env: Record<string, string> = {},
) {
  const asked: { url: URL; auth: string | undefined }[] = [];
  let pages = 0;
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://stand-in");
    if (url.pathname === "/v6/deployments") {
      const step = vercel[Math.min(asked.length, vercel.length - 1)];
      asked.push({ url, auth: request.headers.authorization });
      if (typeof step === "number") {
        response.writeHead(step).end(`{"error":{"message":"${TOKEN}"}}`);
      } else {
        response
          .writeHead(200, { "Content-Type": "application/json" })
          .end(JSON.stringify({ deployments: step }));
      }
      return;
    }
    const id = served[Math.min(pages, served.length - 1)];
    pages += 1;
    response
      .writeHead(200, { "Content-Type": "text/html" })
      .end(`<html data-dpl-id="${id}"><body>Log in</body></html>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  // Everything the script reads is set here, so nothing of the machine's own gets in.
  const settings: NodeJS.ProcessEnv = {
    ...process.env,
    VERCEL_API: address,
    SMOKE_BASE_URL: `${address}/`,
    DEPLOY_TARGET: target,
    DEPLOY_SINCE: SINCE,
    VERCEL_TOKEN: TOKEN,
    VERCEL_ORG_ID: "team_1",
    VERCEL_PROJECT_ID: "prj_1",
    DEPLOY_POLL_SECONDS: "0.05",
    DEPLOY_WAIT_SECONDS: "0.5",
    DEPLOY_APPEAR_SECONDS: "0.2",
    ...env,
  };
  try {
    return await new Promise<{
      status: number;
      out: string;
      asked: typeof asked;
    }>((resolve) => {
      execFile(
        "node",
        [SCRIPT],
        { encoding: "utf8", env: settings },
        (error, stdout, stderr) =>
          resolve({
            status: error ? Number(error.code ?? 1) : 0,
            out: stdout + stderr,
            asked,
          }),
      );
    });
  } finally {
    server.close();
  }
}

describe("wait-for-deploy", () => {
  it("goes on when the address serves the deployment this deploy made", async () => {
    const { status, out, asked } = await run(
      "production",
      [[cli("dpl_new", "READY", "production")]],
      ["dpl_new"],
    );

    expect(status).toBe(0);
    expect(out).toContain("serves dpl_new, made by this deploy");
    expect(asked).toHaveLength(1);
    const query = asked[0].url.searchParams;
    expect(query.get("projectId")).toBe("prj_1");
    expect(query.get("teamId")).toBe("team_1");
    expect(query.get("since")).toBe(String(Date.parse(SINCE)));
    expect(asked[0].auth).toBe(`Bearer ${TOKEN}`);
    expect(out).not.toContain(TOKEN);
  });

  it("waits while the build runs and the address still serves the one before", async () => {
    const { status, out, asked } = await run(
      "production",
      [
        [cli("dpl_new", "BUILDING", "production")],
        [cli("dpl_new", "BUILDING", "production")],
        [cli("dpl_new", "READY", "production")],
      ],
      ["dpl_old", "dpl_old", "dpl_old", "dpl_new"],
    );

    expect(status).toBe(0);
    expect(out).toContain("serves dpl_old; this deploy: dpl_new BUILDING");
    expect(out).toContain("serves dpl_new, made by this deploy");
    expect(asked.length).toBeGreaterThanOrEqual(4);
  });

  it("turns red when the deploy's build failed", async () => {
    const { status, out } = await run(
      "production",
      [[cli("dpl_new", "ERROR", "production")]],
      ["dpl_old"],
    );

    expect(status).toBe(1);
    expect(out).toContain("::error::The deploy's build failed on Vercel");
    expect(out).toContain("dpl_new ERROR");
    expect(out).toContain("still serves dpl_old");
  });

  it("doesn't call a failed build while another of this deploy's is still building", async () => {
    const { status, out } = await run(
      "production",
      [
        [
          cli("dpl_new", "ERROR", "production"),
          git("dpl_twin", "BUILDING", "production", "main"),
        ],
        [
          cli("dpl_new", "ERROR", "production"),
          git("dpl_twin", "READY", "production", "main"),
        ],
      ],
      ["dpl_old", "dpl_twin"],
    );

    expect(status).toBe(0);
    expect(out).toContain("serves dpl_twin, made by this deploy");
  });

  it("turns red when the address never serves this deploy's", async () => {
    const { status, out } = await run(
      "production",
      [[cli("dpl_new", "READY", "production")]],
      ["dpl_old"],
    );

    expect(status).toBe(1);
    expect(out).toMatch(
      /::error::After \d+ minutes .* still serves dpl_old, not one made by this deploy/,
    );
  });

  it("steps aside with a warning when Vercel can't be read, three times and no more", async () => {
    const { status, out, asked } = await run("production", [500], ["dpl_old"]);

    expect(status).toBe(0);
    expect(asked).toHaveLength(3);
    expect(out).toContain("::warning::Vercel's deployments could not be read");
    expect(out).toContain("Vercel's API answered 500");
    expect(out).not.toContain(TOKEN);
  });

  it("starts counting again after an answer", async () => {
    const { status, asked } = await run(
      "production",
      [500, 500, [cli("dpl_new", "READY", "production")]],
      ["dpl_new"],
    );

    expect(status).toBe(0);
    expect(asked).toHaveLength(3);
  });

  it("steps aside when Vercel lists nothing for this target", async () => {
    const { status, out } = await run(
      "production",
      [[git("dpl_preview", "READY", null, "app/1-some-branch")]],
      ["dpl_old"],
    );

    expect(status).toBe(0);
    expect(out).toContain("no production deployment listed yet");
    expect(out).toContain("::warning::Vercel lists no production deployment");
  });

  it("takes the staging deploy for staging, not production's or a branch's preview", async () => {
    const listed = [
      cli("dpl_live", "READY", "production"),
      git("dpl_preview", "READY", null, "app/1-some-branch"),
      cli("dpl_staging", "READY", null),
    ];

    const own = await run("staging", [listed], ["dpl_staging"]);
    expect(own.status).toBe(0);
    expect(own.out).toContain("serves dpl_staging, made by this deploy");
    expect(own.out).not.toContain("dpl_live");
    expect(own.out).not.toContain("dpl_preview");

    const preview = await run("staging", [listed], ["dpl_preview"]);
    expect(preview.status).toBe(1);

    const branch = await run(
      "staging",
      [[git("dpl_branch", "READY", null, "staging")]],
      ["dpl_branch"],
    );
    expect(branch.status).toBe(0);
  });

  it("says what it needs when it is run without its settings", async () => {
    const { status, out } = await run("production", [[]], ["dpl_old"], {
      DEPLOY_SINCE: "",
    });

    expect(status).toBe(1);
    expect(out).toContain(
      "::error::SMOKE_BASE_URL, DEPLOY_TARGET and DEPLOY_SINCE are needed",
    );
  });
});
