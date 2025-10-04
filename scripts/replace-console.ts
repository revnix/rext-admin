#!/usr/bin/env ts-node
/**
 * Script to replace console.* statements with log.* calls from @/lib/logger
 */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "glob";

interface Replacement {
  from: RegExp;
  to: string;
}

function hasLoggerImport(content: string): boolean {
  return (
    content.includes("from '@/lib/logger'") ||
    content.includes('from "@/lib/logger"')
  );
}

function addLoggerImport(content: string): string {
  // Find the position after the last import
  const importRegex = /^import\s+.*?;$/gm;
  const matches = Array.from(content.matchAll(importRegex));

  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const matchIndex = lastMatch.index ?? 0;
    const insertPos = matchIndex + lastMatch[0].length;

    const newImport = "\nimport { log } from '@/lib/logger';";
    return content.slice(0, insertPos) + newImport + content.slice(insertPos);
  } else {
    // No imports found, add at the beginning (after 'use client' if present)
    if (
      content.startsWith('"use client"') ||
      content.startsWith("'use client'")
    ) {
      const endOfDirective = content.indexOf("\n") + 1;
      return (
        content.slice(0, endOfDirective) +
        "\nimport { log } from '@/lib/logger';\n" +
        content.slice(endOfDirective)
      );
    }
    return `import { log } from '@/lib/logger';\n\n${content}`;
  }
}

function replaceConsoleInFile(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, "utf-8");
    let modified = false;

    // Skip if no console statements
    if (!/console\.(log|debug|warn|error|info)\(/.test(content)) {
      return false;
    }

    // Add logger import if needed
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content);
      modified = true;
    }

    // Replace console statements
    const replacements: Replacement[] = [
      { from: /console\.log\(/g, to: "log.info(" },
      { from: /console\.debug\(/g, to: "log.debug(" },
      { from: /console\.warn\(/g, to: "log.warn(" },
      { from: /console\.error\(/g, to: "log.error(" },
      { from: /console\.info\(/g, to: "log.info(" },
    ];

    for (const { from, to } of replacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, "utf-8");
      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
}

async function main() {
  const files = globSync("**/*.{ts,tsx}", {
    ignore: ["node_modules/**", ".next/**", "scripts/**", "dist/**"],
    cwd: process.cwd(),
  });

  let _updatedCount = 0;
  for (const file of files) {
    if (replaceConsoleInFile(file)) {
      _updatedCount++;
    }
  }
}

main();
