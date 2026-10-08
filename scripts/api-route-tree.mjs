// Writes lib/api-client/route-tree.ts from api/openapi.json: the backend's routes as a tree, a fixed part under its
// own name and a parameter ({workspace_id}) as "*". Analytics names a failed request by this tree, so that an id, a
// workspace's name or a keyword in an address never leaves the browser (lib/analytics-failures.ts).
//   node scripts/api-route-tree.mjs            writes the file
//   node scripts/api-route-tree.mjs --check    exits 1 when the file is not what the spec gives
// Run it after `pnpm api:types`, whenever api/openapi.json changes; a test fails until it has been.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "lib/api-client/route-tree.ts");

/** The spec's paths as a tree, its parts in one order. */
export function routeTree(spec) {
  const tree = {};
  for (const route of Object.keys(spec.paths ?? {})) {
    let node = tree;
    for (const part of route.split("/").filter(Boolean)) {
      const key = part.startsWith("{") ? "*" : part;
      node[key] ??= {};
      node = node[key];
    }
  }
  const sorted = (node) =>
    Object.fromEntries(
      Object.keys(node)
        .sort()
        .map((key) => [key, sorted(node[key])]),
    );
  return sorted(tree);
}

/**
 * The file's text for a tree: one string to parse, written the way the formatter keeps it (single
 * quotes round a text full of double ones), so the written file is the checked file.
 */
export function fileFor(tree) {
  const json = JSON.stringify(tree);
  if (/['\\]/.test(json)) {
    throw new Error("a route holds a quote or a backslash: write it out by hand");
  }
  return `// Written by scripts/api-route-tree.mjs from api/openapi.json: don't edit it, run the script.
import type { RouteTree } from "@/lib/analytics-failures";

/** The backend's routes: a fixed part under its own name, a parameter as "*". */
export const API_ROUTE_TREE: RouteTree = JSON.parse(
  '${json}',
);
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = JSON.parse(
    fs.readFileSync(path.join(root, "api/openapi.json"), "utf8"),
  );
  const text = fileFor(routeTree(spec));
  if (process.argv.includes("--check")) {
    const now = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
    if (now !== text) {
      console.error(
        "lib/api-client/route-tree.ts is not what api/openapi.json gives: run node scripts/api-route-tree.mjs",
      );
      process.exit(1);
    }
  } else {
    fs.writeFileSync(out, text);
    console.log(`wrote ${path.relative(root, out)}`);
  }
}
