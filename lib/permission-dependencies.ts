/**
 * Approved Technical Permission Prerequisites Map
 *
 * Maps each permission name to its direct technical prerequisite permissions.
 * Workflow bundles (e.g. content authoring/publishing) are kept separate as
 * optional presets and must not be encoded here.
 *
 * Mirrors rext-backend/src/constants/permission_dependencies.py — the backend
 * resolves the same map independently, so this file is UX, not security.
 */
export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  // Content Domain
  "content.create": ["content.read"],
  "content.update": ["content.read"],
  "content.delete": ["content.read"],
  "content.publish": ["content.read"],

  // Member Domain
  "member.invite": ["member.read"],
  "member.update_role": ["member.read"],
  "member.remove": ["member.read"],

  // Workspace Domain
  "workspace.update": ["workspace.read"],
  "workspace.delete": ["workspace.read"],

  // Role Domain
  "role.create": ["role.read"],
  "role.update": ["role.read"],
  "role.delete": ["role.read"],
  "role.manage_permissions": ["role.read"],

  // User Domain
  "user.invite": ["user.read"],
  "user.update": ["user.read"],
  "user.delete": ["user.read"],
  "user.manage_roles": ["user.read", "role.read"],

  // Billing Domain
  "billing.manage": ["billing.read"],

  // Integration and workspace identity domains
  "integration.create": ["integration.read"],
  "integration.update": ["integration.read"],
  "integration.delete": ["integration.read"],
  "brand_voice.update": ["brand_voice.read"],
  "brand_voice.delete": ["brand_voice.read"],
  "persona.create": ["persona.read"],
  "persona.update": ["persona.read"],
  "persona.delete": ["persona.read"],
  "security.manage": ["security.read"],
};

/**
 * Resolves all transitive prerequisite permissions for a list of permission names.
 */
export function resolvePermissionPrerequisites(
  selectedPermissionNames: string[],
): string[] {
  const result = new Set<string>(selectedPermissionNames);
  const queue = [...selectedPermissionNames];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = PERMISSION_DEPENDENCIES[current] || [];
    for (const dep of deps) {
      if (!result.has(dep)) {
        result.add(dep);
        queue.push(dep);
      }
    }
  }

  return Array.from(result);
}

/**
 * Updates selected permission names when a permission is toggled.
 * - When selecting: automatically includes all transitive prerequisites.
 * - When deselecting: automatically removes any permission depending on the toggled permission.
 */
export function updatePermissionSelection(
  currentSelectedNames: string[],
  toggledName: string,
  isSelecting: boolean,
): string[] {
  if (isSelecting) {
    return resolvePermissionPrerequisites([
      ...currentSelectedNames,
      toggledName,
    ]);
  }

  // Deselecting: Find all permissions that transitively depend on toggledName
  const toRemove = new Set<string>([toggledName]);

  let changed = true;
  while (changed) {
    changed = false;
    for (const [permName, deps] of Object.entries(PERMISSION_DEPENDENCIES)) {
      if (!toRemove.has(permName) && deps.some((dep) => toRemove.has(dep))) {
        toRemove.add(permName);
        changed = true;
      }
    }
  }

  return currentSelectedNames.filter((name) => !toRemove.has(name));
}

/**
 * Orders permissions so dependents come before their prerequisites.
 *
 * Bulk revoke sends one DELETE per permission and the backend cascades each
 * removal to dependents. Revoking dependents first means that cascade never
 * removes a permission still queued for its own DELETE. A dependent always has
 * a strictly larger prerequisite closure than its prerequisites, so sorting by
 * closure size is enough.
 */
export function orderPermissionsForRevocation(
  permissionNames: string[],
): string[] {
  const closureSize = (name: string) =>
    resolvePermissionPrerequisites([name]).length;
  return [...permissionNames].sort((a, b) => closureSize(b) - closureSize(a));
}
