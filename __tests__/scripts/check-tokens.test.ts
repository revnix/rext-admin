import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// scripts/check-tokens.mjs on one wrong sample per rule (each must fail and name its rule) and on the
// stylesheets (which must pass). The script also tests its own rules before every run.
const ROOT = path.resolve(__dirname, "../..");
const SCRIPT = path.join(ROOT, "scripts/check-tokens.mjs");

function run(...files: string[]) {
  try {
    return {
      status: 0,
      out: execFileSync("node", [SCRIPT, ...files], {
        cwd: ROOT,
        encoding: "utf8",
      }),
    };
  } catch (error) {
    const failed = error as { status: number; stdout: string };
    return { status: failed.status, out: failed.stdout };
  }
}

const samples: Array<[string, string, string]> = [
  ["stock-palette", "a.tsx", '<p className="text-slate-900" />'],
  ["arbitrary-colour", "a.tsx", '<p className="bg-[#0366F8]" />'],
  ["literal-colour", "a.ts", 'export const ink = "#0A0A0A";'],
  ["inline-colour", "a.tsx", '<p style={{ color: "red" }} />'],
  ["inline-colour", "b.tsx", '<p style={{ color: "rebeccapurple" }} />'],
  ["unknown-variable", "a.tsx", '<path stroke="var(--color-not-a-role)" />'],
  ["dark-class", "a.tsx", '<p className="dark:bg-card" />'],
  ["arbitrary-radius", "a.tsx", '<p className="rounded-[7px]" />'],
  ["arbitrary-shadow", "a.tsx", '<p className="shadow-[0_1px_2px_black]" />'],
  ["arbitrary-size", "a.tsx", '<p className="text-[15px]" />'],
  ["arbitrary-size", "b.tsx", '<p className="[font-size:15px]" />'],
  ["small-type", "a.tsx", '<p className="text-[10px]" />'],
  ["small-type", "b.tsx", '<p className="text-[clamp(10px,1vw,16px)]" />'],
  ["off-scale", "a.tsx", '<p className="rounded-xl shadow-lg" />'],
  ["radius-token", "a.css", ":root { --card-radius: 12px; }"],
  [
    "shadow-token",
    "a.css",
    ":root { --card-shadow: 0 1px 2px var(--border); }",
  ],
  ["small-type", "a.css", "@theme { --text-tiny: 0.625rem; }"],
  ["literal-colour", "a.css", ".x { color: #123456; }"],
  ["literal-colour", "b.css", ".x { color: rebeccapurple; }"],
  ["arbitrary-radius", "a.css", ".x { border-radius: 17px; }"],
  ["arbitrary-shadow", "a.css", ".x { box-shadow: 0 1px 2px black; }"],
  ["arbitrary-size", "a.css", ".x { font-size: 0.875rem; }"],
  ["small-type", "b.css", ".x { font-size: 10px; }"],
  ["off-scale", "a.css", ".x { @apply rounded-xl; }"],
];

describe("tokens:check", () => {
  let dir: string;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it.each(samples)("fails on %s (%s)", (rule, name, text) => {
    const file = path.join(dir, `${rule}-${name}`);
    fs.writeFileSync(file, `${text}\n`);
    const { status, out } = run(file);
    expect(status).toBe(1);
    expect(out).toContain(`  ${rule}  `);
  });

  it("passes on a line excused with tokens-ok", () => {
    const file = path.join(dir, "excused.tsx");
    fs.writeFileSync(
      file,
      '<p className="text-slate-900" /> {/* tokens-ok: a sample */}\n',
    );
    expect(run(file).status).toBe(0);
  });

  it("passes on tokens and rings in a rule", () => {
    const file = path.join(dir, "tokens.css");
    fs.writeFileSync(
      file,
      ".x { font-size: var(--text-body); border-radius: var(--radius) 0 0 var(--radius); box-shadow: 0 0 0 1px var(--ring); }\n",
    );
    expect(run(file).status).toBe(0);
  });

  it("finds in the stylesheets only the font sizes written by hand", () => {
    // The tokens pass; the sizes in rules wait for B6 (prose) and B7 (the sweep), in the baseline until then.
    const { out } = run("app/globals.css", "app/styles/article.css");
    const rules = out
      .split("\n")
      .filter((line) => /^\S+:\d+ {2}/.test(line))
      .map((line) => line.split("  ")[1]);
    expect(rules.filter((rule) => rule !== "arbitrary-size")).toEqual([]);
  });
});
