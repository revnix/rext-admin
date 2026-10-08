/**
 * The app's own words, for a session recording (lib/recording-words.ts says why).
 *
 * GET /api/recording-words -> the mark of each text ("1x2abc.9zk3q", …), not the texts
 *
 * Read from the source once, when the app is built, with the TypeScript compiler's parser: the
 * answer is static, so the running app serves the build's list and reads no file. Where the
 * source or the compiler isn't there the list is empty, and nothing is recorded.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { markOf, wordsInSource } from "@/lib/recording-words";

export const dynamic = "force-static";

/** Where text a person can see is written. */
const SOURCE_FOLDERS = [
  "app",
  "components",
  "hooks",
  "lib",
  "providers",
  "schemas",
  "stores",
];

/** The sample pages (the primitives, the tokens): their content is examples, not the app's words. */
const SAMPLES = /^dev(?:[\\/]|$)/;

async function appWords(): Promise<string[]> {
  const words = new Set<string>();
  // The compiler is there when the app is built, which is when this runs.
  const ts = await import("typescript").catch(() => null);
  if (!ts) return [];
  const root = /* turbopackIgnore: true */ process.cwd();
  for (const folder of SOURCE_FOLDERS) {
    let files: string[];
    try {
      files = readdirSync(path.join(root, folder), {
        recursive: true,
        encoding: "utf8",
      });
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/\.tsx?$/.test(file) || /\.d\.ts$|\.test\.tsx?$/.test(file))
        continue;
      if (folder === "app" && SAMPLES.test(file)) continue;
      try {
        const source = readFileSync(path.join(root, folder, file), "utf8");
        for (const text of wordsInSource(ts, file, source)) words.add(text);
      } catch {
        // A folder named like a source file, or one that went away: nothing to read.
      }
    }
  }
  // As marks: the address answers anyone, and gives them nothing to read.
  return [...new Set([...words].map(markOf))].sort();
}

export async function GET() {
  return Response.json(await appWords(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
