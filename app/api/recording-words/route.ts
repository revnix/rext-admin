/**
 * The app's own words, for a session recording (lib/recording-words.ts says why).
 *
 * GET /api/recording-words -> ["Save", "Status", …]
 *
 * Read from the source once, when the app is built: the answer is static, so the running app
 * serves the build's list and reads no file. Where the source can't be read the list is empty,
 * and a recording then shows no text at all.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { wordsInSource } from "@/lib/recording-words";

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

function appWords(): string[] {
  const words = new Set<string>();
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
      try {
        const source = readFileSync(path.join(root, folder, file), "utf8");
        for (const text of wordsInSource(source)) words.add(text);
      } catch {
        // A folder named like a source file, or one that went away: nothing to read.
      }
    }
  }
  return [...words].sort();
}

export function GET() {
  return Response.json(appWords(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
