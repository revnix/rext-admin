// Marks the elements a session recording may show the text of (lib/recording-marks.ts says which and why):
// adds data-rec="show" to every button, menu item, label and table header whose content is fixed text in
// the source and that carries no data-rec yet. An element that holds a value is left alone, and so stays
// hidden in a recording.
//
//   node scripts/mark-recordable.mjs            what it would add, per file, and any mark that is wrong
//   node scripts/mark-recordable.mjs --write    adds them (run `pnpm format` on the changed files after)
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { markFixedText, markProblems } from "../lib/recording-marks.ts";

const root = path.resolve(import.meta.dirname, "..");
const write = process.argv.includes("--write");
// The admin area and the sample pages are never recorded: nothing to mark there.
const SKIPPED = /^(?:app[\\/](?:admin|dev)|components[\\/]admin)(?:[\\/]|$)/;

let added = 0;
let removed = 0;
let files = 0;
const problems = [];
for (const folder of ["app", "components"]) {
  for (const name of fs.readdirSync(path.join(root, folder), { recursive: true, encoding: "utf8" })) {
    const file = path.join(folder, name);
    if (!file.endsWith(".tsx") || file.endsWith(".test.tsx") || SKIPPED.test(file)) continue;
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const marked = markFixedText(ts, file, source);
    // What stays wrong after the pass: the asserted marks are the test's to judge, not this script's.
    problems.push(
      ...markProblems(ts, file, write ? marked.source : source).filter(
        (problem) => !problem.includes('data-rec="own" is allowed only'),
      ),
    );
    if (marked.added === 0 && marked.removed === 0) continue;
    added += marked.added;
    removed += marked.removed;
    files += 1;
    if (write) fs.writeFileSync(path.join(root, file), marked.source);
    else console.log(`+${marked.added} -${marked.removed}  ${file}`);
  }
}
for (const problem of problems) console.log(`wrong: ${problem}`);
console.log(`${write ? "added" : "would add"} ${added} mark(s), ${write ? "took off" : "would take off"} ${removed}, in ${files} file(s); ${problems.length} wrong mark(s)`);
process.exitCode = problems.length > 0 ? 1 : 0;
