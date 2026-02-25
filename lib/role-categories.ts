import { ROLES } from "@/lib/permissions";

/**
 * High-level role categories used for UI personalization (onboarding tours,
 * permission summaries, first-task recommendations, etc.).
 *
 * These categories group the exact RBAC role names from `ROLES` into
 * UX-relevant buckets. The mapping is intentionally separate from the
 * permission system — it controls *display*, not *access*.
 */
export type RoleCategory = "owner" | "admin" | "editor" | "viewer";

/**
 * Maps an exact RBAC role name to its display category.
 * Lookup is performed against the canonical `ROLES` constant first;
 * if no exact match is found, a normalized-substring fallback is used
 * so that ad-hoc role labels from the backend (e.g. "Workspace Admin")
 * still resolve correctly.
 */
const EXACT_ROLE_MAP: Record<string, RoleCategory> = {
    [ROLES.WORKSPACE_OWNER]: "owner",
    [ROLES.SUPER_ADMIN]: "admin",
    [ROLES.ADMIN]: "admin",
    [ROLES.WORKSPACE_ADMIN]: "admin",
    [ROLES.EDITOR]: "editor",
    [ROLES.VIEWER]: "viewer",
    [ROLES.USER]: "viewer",
};

/**
 * Ordered substring patterns used as a fallback when the role name is
 * not an exact match against `ROLES` values (e.g. display labels like
 * "Content Editor" or "Workspace Owner").
 *
 * Order matters: more privileged categories are checked first so that
 * "admin_viewer" would resolve to "admin", not "viewer".
 */
const SUBSTRING_PATTERNS: readonly { pattern: string; category: RoleCategory }[] = [
    { pattern: "owner", category: "owner" },
    { pattern: "super_admin", category: "admin" },
    { pattern: "admin", category: "admin" },
    { pattern: "editor", category: "editor" },
    { pattern: "manager", category: "editor" },
    { pattern: "viewer", category: "viewer" },
    { pattern: "member", category: "viewer" },
] as const;

/**
 * Resolves any role name string to a `RoleCategory`.
 *
 * Resolution order:
 * 1. Exact match against `ROLES` constant values (fastest, preferred).
 * 2. Normalized substring match (fallback for display labels).
 * 3. Default to `"viewer"` if nothing matches.
 *
 * @example
 * ```ts
 * detectRoleCategory("workspace_owner");  // "owner"
 * detectRoleCategory("Workspace Admin");  // "admin"
 * detectRoleCategory("Content Editor");   // "editor"
 * detectRoleCategory("unknown_role");     // "viewer"
 * ```
 */
export function detectRoleCategory(roleName: string): RoleCategory {
    if (!roleName) return "viewer";

    // 1. Try exact match first (O(1) lookup)
    const exactMatch = EXACT_ROLE_MAP[roleName];
    if (exactMatch) return exactMatch;

    // 2. Normalize and try substring fallback
    const normalized = roleName.toLowerCase();
    for (const { pattern, category } of SUBSTRING_PATTERNS) {
        if (normalized.includes(pattern)) return category;
    }

    // 3. Default fallback
    return "viewer";
}
