#!/usr/bin/env node

/**
 * Action Buttons Audit Script
 *
 * Scans all workspace pages for Button components and checks if they're
 * properly protected with PermissionGuard or permission hooks.
 *
 * Usage:
 *   node scripts/audit_action_buttons.mjs
 *
 * Output:
 *   - action-buttons-audit-report.md (human-readable)
 *   - action-buttons-inventory.json (machine-readable)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WORKSPACE_PAGES_DIR = path.join(
  __dirname,
  "..",
  "app",
  "w",
  "[workspaceSlug]",
);
const ADMIN_PAGES_DIR = path.join(__dirname, "..", "app", "admin");
const OUTPUT_JSON = path.join(
  __dirname,
  "..",
  "..",
  "action-buttons-inventory.json",
);
const OUTPUT_MD = path.join(
  __dirname,
  "..",
  "..",
  "action-buttons-audit-report.md",
);

// Action keywords that indicate permission-required buttons
const ACTION_KEYWORDS = [
  "delete",
  "remove",
  "edit",
  "update",
  "create",
  "add",
  "new",
  "publish",
  "unpublish",
  "approve",
  "reject",
  "cancel",
  "invite",
  "revoke",
  "transfer",
  "change",
  "save",
  "submit",
  "archive",
  "restore",
  "duplicate",
  "export",
  "import",
  "resend",
  "activate",
  "deactivate",
  "upgrade",
  "downgrade",
];

// Button component patterns to detect
const BUTTON_PATTERNS = [
  /<Button\b/g,
  /<TableActionButton\b/g,
  /<ActionButton\b/g,
  /<IconButton\b/g,
];

// Permission protection patterns
const PROTECTION_PATTERNS = {
  permissionGuard: /<PermissionGuard\b/,
  canAccess: /<CanAccess\b/,
  usePermission: /use(?:Workspace)?Permission\(/,
  useAnyPermission: /useAny(?:Workspace)?Permission\(/,
  useAllPermissions: /useAll(?:Workspace)?Permissions\(/,
  hasPermission: /hasPermission\s*=/,
};

// Statistics
const stats = {
  totalFiles: 0,
  filesWithButtons: 0,
  totalButtons: 0,
  protectedButtons: 0,
  unprotectedButtons: 0,
  suspiciousButtons: 0,
  byCategory: {},
};

// Results storage
const results = {
  protected: [],
  unprotected: [],
  suspicious: [],
  summary: {},
};

/**
 * Recursively find all .tsx files in a directory
 */
function findTsxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract category from file path
 */
function extractCategory(filePath) {
  if (filePath.includes("/content/")) return "Content";
  if (filePath.includes("/media/")) return "Media";
  if (filePath.includes("/members/")) return "Members";
  if (filePath.includes("/settings/")) return "Settings";
  if (filePath.includes("/admin/")) return "Admin";
  if (filePath.includes("/billing/")) return "Billing";
  if (filePath.includes("/subscription/")) return "Subscription";
  return "Other";
}

/**
 * Check if a button is likely an action button based on its content
 */
function isActionButton(buttonContent) {
  const lowerContent = buttonContent.toLowerCase();
  return ACTION_KEYWORDS.some((keyword) => lowerContent.includes(keyword));
}

/**
 * Extract button text/aria-label for identification
 */
function extractButtonLabel(buttonContent) {
  // Try to extract text content
  const textMatch = buttonContent.match(/>([^<]+)</);
  if (textMatch) return textMatch[1].trim();

  // Try to extract aria-label
  const ariaMatch = buttonContent.match(/aria-label="([^"]+)"/);
  if (ariaMatch) return ariaMatch[1];

  // Try to extract title
  const titleMatch = buttonContent.match(/title="([^"]+)"/);
  if (titleMatch) return titleMatch[1];

  return "[No label found]";
}

/**
 * Extract onClick handler name
 */
function extractOnClickHandler(buttonContent) {
  const onClickMatch = buttonContent.match(/onClick=\{([^}]+)\}/);
  if (onClickMatch) return onClickMatch[1].trim();
  return null;
}

/**
 * Check if file content has permission protection patterns
 */
function hasPermissionProtection(content) {
  for (const [name, pattern] of Object.entries(PROTECTION_PATTERNS)) {
    if (pattern.test(content)) {
      return { protected: true, method: name };
    }
  }
  return { protected: false, method: null };
}

/**
 * Suggest permission based on button label and category
 */
function suggestPermission(label, category, onClick) {
  const lower = `${label} ${onClick || ""}`.toLowerCase();

  // Content permissions
  if (category === "Content") {
    if (lower.includes("delete")) return "content.delete";
    if (lower.includes("edit") || lower.includes("update"))
      return "content.update";
    if (lower.includes("create") || lower.includes("new"))
      return "content.create";
    if (lower.includes("publish")) return "content.publish";
    if (lower.includes("export")) return "content.export";
  }

  // Media permissions
  if (category === "Media") {
    if (lower.includes("delete")) return "media.delete";
    if (lower.includes("upload") || lower.includes("create"))
      return "media.upload";
    if (lower.includes("organize")) return "media.organize";
  }

  // Member permissions
  if (category === "Members") {
    if (lower.includes("remove")) return "member.remove";
    if (lower.includes("invite")) return "member.invite";
    if (lower.includes("role")) return "member.update_role";
    if (lower.includes("resend")) return "member.resend_invitation";
  }

  // Settings/Workspace permissions
  if (category === "Settings") {
    if (lower.includes("delete workspace")) return "workspace.delete";
    if (lower.includes("transfer")) return "workspace.transfer";
    if (lower.includes("update") || lower.includes("save"))
      return "workspace.update";
  }

  // Admin permissions
  if (category === "Admin") {
    if (lower.includes("delete")) return "user.delete";
    if (lower.includes("create")) return "user.create";
    if (lower.includes("update") || lower.includes("edit"))
      return "user.update";
  }

  // Generic fallback
  if (lower.includes("delete")) return "[resource].delete";
  if (lower.includes("create")) return "[resource].create";
  if (lower.includes("update") || lower.includes("edit"))
    return "[resource].update";

  return "[permission unknown]";
}

/**
 * Analyze a single file for action buttons
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);
  const category = extractCategory(filePath);

  // Initialize category stats
  if (!stats.byCategory[category]) {
    stats.byCategory[category] = {
      files: 0,
      buttons: 0,
      protected: 0,
      unprotected: 0,
    };
  }

  // Check if file has any buttons
  let hasButtons = false;
  for (const pattern of BUTTON_PATTERNS) {
    if (pattern.test(content)) {
      hasButtons = true;
      break;
    }
  }

  if (!hasButtons) {
    return;
  }

  stats.filesWithButtons++;
  stats.byCategory[category].files++;

  // Check file-level protection
  const fileProtection = hasPermissionProtection(content);

  // Find all button instances
  const lines = content.split("\n");
  const _buttons = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains a Button component
    let hasButton = false;
    for (const pattern of BUTTON_PATTERNS) {
      if (pattern.test(line)) {
        hasButton = true;
        break;
      }
    }

    if (!hasButton) continue;

    // Extract button context (5 lines before and after)
    const contextStart = Math.max(0, i - 5);
    const contextEnd = Math.min(lines.length, i + 5);
    const context = lines.slice(contextStart, contextEnd).join("\n");

    const label = extractButtonLabel(context);
    const onClick = extractOnClickHandler(context);

    // Only track action buttons
    if (!isActionButton(label) && !isActionButton(onClick || "")) {
      continue;
    }

    stats.totalButtons++;
    stats.byCategory[category].buttons++;

    const buttonInfo = {
      file: relativePath,
      line: i + 1,
      category,
      label,
      onClick,
      context: context.trim(),
      suggestedPermission: suggestPermission(label, category, onClick),
    };

    // Check if this specific button has protection nearby
    const contextProtection = hasPermissionProtection(context);

    if (contextProtection.protected || fileProtection.protected) {
      buttonInfo.protected = true;
      buttonInfo.protectionMethod =
        contextProtection.method || fileProtection.method;
      stats.protectedButtons++;
      stats.byCategory[category].protected++;
      results.protected.push(buttonInfo);
    } else {
      buttonInfo.protected = false;
      stats.unprotectedButtons++;
      stats.byCategory[category].unprotected++;

      // Mark as suspicious if it's a destructive action
      if (
        label.toLowerCase().includes("delete") ||
        label.toLowerCase().includes("remove") ||
        onClick?.toLowerCase().includes("delete")
      ) {
        buttonInfo.suspicious = true;
        stats.suspiciousButtons++;
        results.suspicious.push(buttonInfo);
      }

      results.unprotected.push(buttonInfo);
    }
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport() {
  const lines = [];

  lines.push("# Action Buttons Audit Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Script:** scripts/audit_action_buttons.mjs`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- **Total Files Scanned:** ${stats.totalFiles}`);
  lines.push(`- **Files with Action Buttons:** ${stats.filesWithButtons}`);
  lines.push(`- **Total Action Buttons:** ${stats.totalButtons}`);
  lines.push(
    `- **Protected Buttons:** ${stats.protectedButtons} (${((stats.protectedButtons / stats.totalButtons) * 100 || 0).toFixed(1)}%)`,
  );
  lines.push(
    `- **Unprotected Buttons:** ${stats.unprotectedButtons} (${((stats.unprotectedButtons / stats.totalButtons) * 100 || 0).toFixed(1)}%)`,
  );
  lines.push(`- **Suspicious (Delete/Remove):** ${stats.suspiciousButtons} 🔴`);
  lines.push("");

  // Risk Assessment
  const riskLevel =
    stats.suspiciousButtons > 10
      ? "🔴 CRITICAL"
      : stats.suspiciousButtons > 5
        ? "🟠 HIGH"
        : stats.unprotectedButtons > 20
          ? "🟡 MEDIUM"
          : "🟢 LOW";

  lines.push(`**Risk Level:** ${riskLevel}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // By Category
  lines.push("## Breakdown by Category");
  lines.push("");
  lines.push(
    "| Category | Files | Buttons | Protected | Unprotected | % Protected |",
  );
  lines.push(
    "|----------|-------|---------|-----------|-------------|-------------|",
  );

  Object.entries(stats.byCategory)
    .sort((a, b) => b[1].unprotected - a[1].unprotected)
    .forEach(([category, data]) => {
      const pct =
        data.buttons > 0
          ? ((data.protected / data.buttons) * 100).toFixed(1)
          : 0;
      lines.push(
        `| ${category} | ${data.files} | ${data.buttons} | ${data.protected} | ${data.unprotected} | ${pct}% |`,
      );
    });

  lines.push("");
  lines.push("---");
  lines.push("");

  // Suspicious Buttons (Critical)
  if (results.suspicious.length > 0) {
    lines.push("## 🔴 CRITICAL: Unprotected Destructive Actions");
    lines.push("");
    lines.push(
      "These buttons perform delete/remove operations without permission checks:",
    );
    lines.push("");

    results.suspicious.forEach((btn, idx) => {
      lines.push(`### ${idx + 1}. ${btn.label}`);
      lines.push("");
      lines.push(`- **File:** \`${btn.file}:${btn.line}\``);
      lines.push(`- **Category:** ${btn.category}`);
      lines.push(`- **Action:** ${btn.onClick || "N/A"}`);
      lines.push(`- **Suggested Permission:** \`${btn.suggestedPermission}\``);
      lines.push("");
      lines.push("**Context:**");
      lines.push("```tsx");
      lines.push(btn.context);
      lines.push("```");
      lines.push("");
    });

    lines.push("---");
    lines.push("");
  }

  // Unprotected Buttons
  if (results.unprotected.length > 0) {
    lines.push("## ⚠️ Unprotected Action Buttons");
    lines.push("");
    lines.push(
      `Found ${results.unprotected.length} action buttons without permission checks:`,
    );
    lines.push("");

    // Group by category
    const byCategory = {};
    results.unprotected.forEach((btn) => {
      if (!byCategory[btn.category]) byCategory[btn.category] = [];
      byCategory[btn.category].push(btn);
    });

    Object.entries(byCategory).forEach(([category, buttons]) => {
      lines.push(`### ${category} (${buttons.length} buttons)`);
      lines.push("");
      lines.push("| # | Label | File | Line | Suggested Permission |");
      lines.push("|---|-------|------|------|---------------------|");

      buttons.forEach((btn, idx) => {
        const shortFile = btn.file.replace("app/w/[workspaceSlug]/", "");
        lines.push(
          `| ${idx + 1} | ${btn.label} | ${shortFile} | ${btn.line} | \`${btn.suggestedPermission}\` |`,
        );
      });

      lines.push("");
    });

    lines.push("---");
    lines.push("");
  }

  // Protected Buttons (for verification)
  lines.push("## ✅ Protected Action Buttons");
  lines.push("");
  lines.push(
    `Found ${results.protected.length} properly protected action buttons:`,
  );
  lines.push("");

  if (results.protected.length > 0) {
    // Group by protection method
    const byMethod = {};
    results.protected.forEach((btn) => {
      const method = btn.protectionMethod || "unknown";
      if (!byMethod[method]) byMethod[method] = [];
      byMethod[method].push(btn);
    });

    Object.entries(byMethod).forEach(([method, buttons]) => {
      lines.push(`### Using \`${method}\` (${buttons.length} buttons)`);
      lines.push("");
      lines.push("| Label | File | Line | Category |");
      lines.push("|-------|------|------|----------|");

      buttons.slice(0, 20).forEach((btn) => {
        const shortFile = btn.file.replace("app/w/[workspaceSlug]/", "");
        lines.push(
          `| ${btn.label} | ${shortFile} | ${btn.line} | ${btn.category} |`,
        );
      });

      if (buttons.length > 20) {
        lines.push(`| ... | (${buttons.length - 20} more) | ... | ... |`);
      }

      lines.push("");
    });
  }

  lines.push("---");
  lines.push("");

  // Recommendations
  lines.push("## 📋 Implementation Recommendations");
  lines.push("");
  lines.push("### Priority 1: Fix Suspicious Buttons (CRITICAL)");
  lines.push("");
  lines.push(
    `Wrap ${stats.suspiciousButtons} destructive action buttons in \`<PermissionGuard>\`:`,
  );
  lines.push("");
  lines.push("```tsx");
  lines.push('<PermissionGuard permission="resource.delete">');
  lines.push('  <Button onClick={handleDelete} variant="destructive">');
  lines.push("    Delete");
  lines.push("  </Button>");
  lines.push("</PermissionGuard>");
  lines.push("```");
  lines.push("");

  lines.push("### Priority 2: Fix All Unprotected Buttons");
  lines.push("");
  lines.push(
    `Protect remaining ${stats.unprotectedButtons - stats.suspiciousButtons} action buttons.`,
  );
  lines.push("");

  lines.push("### Priority 3: Verify Protected Buttons");
  lines.push("");
  lines.push(
    "Ensure protected buttons use correct permissions (check against backend routes).",
  );
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push("**End of Report**");

  return lines.join("\n");
}

/**
 * Main execution
 */
function main() {
  // Find all files
  const workspaceFiles = findTsxFiles(WORKSPACE_PAGES_DIR);
  const adminFiles = findTsxFiles(ADMIN_PAGES_DIR);
  const allFiles = [...workspaceFiles, ...adminFiles];

  stats.totalFiles = allFiles.length;

  // Analyze each file
  allFiles.forEach((file, idx) => {
    process.stdout.write(`\rAnalyzing... ${idx + 1}/${allFiles.length}`);
    analyzeFile(file);
  });

  // Generate results
  results.summary = {
    generatedAt: new Date().toISOString(),
    stats,
    categories: stats.byCategory,
  };

  // Write JSON output
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));

  // Write markdown report
  const markdown = generateMarkdownReport();
  fs.writeFileSync(OUTPUT_MD, markdown);

  // Exit code
  if (stats.suspiciousButtons > 0) {
    process.exit(1);
  } else if (stats.unprotectedButtons > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the script
main();
