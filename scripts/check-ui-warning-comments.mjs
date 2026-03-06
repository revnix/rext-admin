#!/usr/bin/env node

import { execSync } from "node:child_process";

const COMMENT_PATTERN = "TODO|FIXME|XXX|HACK";
const TARGET_PATHS = ["components/ui", "lib"];

const command = `rg -n --glob '*.{ts,tsx,js,jsx}' "${COMMENT_PATTERN}" ${TARGET_PATHS.join(" ")}`;

try {
    const output = execSync(command, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    if (output.length > 0) {
        console.error("Disallowed warning comments found in shared UI modules:");
        console.error(output);
        process.exit(1);
    }
} catch (error) {
    const stdout = String(error?.stdout ?? "").trim();

    // rg exits with code 1 when no matches are found.
    if (stdout.length === 0) {
        process.exit(0);
    }

    console.error("Disallowed warning comments found in shared UI modules:");
    console.error(stdout);
    process.exit(1);
}

process.exit(0);
