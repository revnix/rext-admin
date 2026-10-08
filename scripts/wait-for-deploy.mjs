// Waits until Vercel serves the deploy this workflow run started, so the smoke test opens the new
// dashboard and not the one before it (.github/workflows/ci_cd.yaml deploys with `--no-wait`).
//   node scripts/wait-for-deploy.mjs
// It reads, and only reads: the project's deployments from Vercel's API, and the address's sign-in page,
// whose markup names the deployment that served it (`dpl_…`).
//
// The environment:
//   SMOKE_BASE_URL     the address the deploy serves (https://app.rext.ai)
//   DEPLOY_TARGET      production | staging
//   DEPLOY_SINCE       when the workflow run began (ISO 8601): a deployment made from then on is this
//                      run's, or a later run's, which contains it
//   VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID     the deploy job's own; never printed
//
// It ends with:
//   0  the address serves a deployment made since the run began;
//   0  with a warning, when it can't tell: Vercel's API didn't answer three times in a row, or lists no
//      deployment for this target. A fault in this script's own reading must not turn a deploy red;
//   1  the deploy's build failed on Vercel, or after eight minutes the address still serves an older
//      deployment. Both are for a person to look at.

const API = process.env.VERCEL_API ?? "https://api.vercel.com";
const BASE = (process.env.SMOKE_BASE_URL ?? "").replace(/\/+$/, "");
const TARGET = process.env.DEPLOY_TARGET;
const SINCE = Date.parse(process.env.DEPLOY_SINCE ?? "");
const POLL_MS = Number(process.env.DEPLOY_POLL_SECONDS ?? 10) * 1000;
const WAIT_MS = Number(process.env.DEPLOY_WAIT_SECONDS ?? 480) * 1000;
const APPEAR_MS = Number(process.env.DEPLOY_APPEAR_SECONDS ?? 120) * 1000;
const DONE = ["READY", "ERROR", "CANCELED"];

const say = (line) => console.log(line);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const short = (id) => String(id).slice(0, 12);

/**
 * Whether a deployment is one for this target. The workflow's own (`source: cli`) carry the target for
 * production and none for the staging environment; one Vercel built from the branch carries the branch.
 */
function isFor(target, deployment) {
  if (target === "production") return deployment.target === "production";
  if (deployment.target === "production") return false;
  return (
    deployment.source === "cli" ||
    deployment.meta?.githubCommitRef === "staging"
  );
}

/** What to do now: "served", "failed", or "wait". */
function judge(deployments, served) {
  const ready = deployments.filter((d) => d.state === "READY");
  if (ready.some((d) => d.uid === served)) return "served";
  const building = deployments.some((d) => !DONE.includes(d.state));
  const failed = deployments.some(
    (d) => d.source === "cli" && (d.state === "ERROR" || d.state === "CANCELED"),
  );
  return failed && !building ? "failed" : "wait";
}

async function listDeployments() {
  const url = new URL("/v6/deployments", API);
  url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID ?? "");
  url.searchParams.set("teamId", process.env.VERCEL_ORG_ID ?? "");
  url.searchParams.set("since", String(SINCE));
  url.searchParams.set("limit", "50");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN ?? ""}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Vercel's API answered ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.deployments)) {
    throw new Error("Vercel's API answered without a list of deployments");
  }
  return body.deployments;
}

/** The deployment that serves the address now, read from its sign-in page; "" when it can't be read. */
async function servedDeployment() {
  try {
    const response = await fetch(`${BASE}/login`, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(15_000),
    });
    return (await response.text()).match(/dpl_[A-Za-z0-9]+/)?.[0] ?? "";
  } catch {
    return "";
  }
}

async function main() {
  if (!BASE || !TARGET || Number.isNaN(SINCE)) {
    say("::error::SMOKE_BASE_URL, DEPLOY_TARGET and DEPLOY_SINCE are needed");
    return 1;
  }
  const began = Date.now();
  let unread = 0;
  let served = "";
  let mine = [];
  for (;;) {
    const waited = Date.now() - began;
    try {
      mine = (await listDeployments()).filter((d) => isFor(TARGET, d));
      unread = 0;
    } catch (error) {
      unread += 1;
      say(`could not read the deployments (${error.message}), ${unread} of 3`);
      if (unread === 3) {
        say(
          "::warning::Vercel's deployments could not be read: the smoke test runs on what the address serves now",
        );
        return 0;
      }
      await sleep(POLL_MS);
      continue;
    }

    if (mine.length === 0) {
      if (waited >= APPEAR_MS) {
        say(
          `::warning::Vercel lists no ${TARGET} deployment since ${process.env.DEPLOY_SINCE}: the smoke test runs on what the address serves now`,
        );
        return 0;
      }
      say(`no ${TARGET} deployment listed yet`);
    } else {
      served = await servedDeployment();
      const verdict = judge(mine, served);
      const states = mine.map((d) => `${short(d.uid)} ${d.state}`).join(", ");
      if (verdict === "served") {
        say(`${BASE} serves ${short(served)}, made by this deploy (${states})`);
        return 0;
      }
      if (verdict === "failed") {
        say(
          `::error::The deploy's build failed on Vercel (${states}); ${BASE} still serves ${short(served) || "an unread deployment"}`,
        );
        return 1;
      }
      say(`${BASE} serves ${short(served) || "?"}; this deploy: ${states}`);
    }

    if (waited >= WAIT_MS) {
      say(
        `::error::After ${Math.round(waited / 60_000)} minutes ${BASE} still serves ${short(served) || "an unread deployment"}, not one made by this deploy`,
      );
      return 1;
    }
    await sleep(POLL_MS);
  }
}

process.exit(await main());
