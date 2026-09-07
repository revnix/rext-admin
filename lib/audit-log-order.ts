import { AuditActions } from "@/types/audit-log";
import type { AuditLog } from "@/types/audit-log";

/**
 * Lifecycle position of an action within the life of a single resource.
 * A resource has to be created before it can be updated or deleted, so these
 * ranks are only ever compared between two events acting on the SAME resource.
 */
const lifecycleRank: Record<string, number> = {
  [AuditActions.WORKSPACE_CREATE]: 0,
  [AuditActions.WORKSPACE_UPDATE]: 1,
  [AuditActions.WORKSPACE_DELETE]: 2,
  [AuditActions.USER_CREATE]: 0,
  [AuditActions.USER_UPDATE]: 1,
  [AuditActions.USER_DELETE]: 2,
};

function isLifecycleAction(action: string): boolean {
  return action in lifecycleRank;
}

/**
 * The resource a log entry belongs to. Non-lifecycle entries (logins, exports,
 * …) are deliberately keyed by their own id so they stay independent and keep
 * plain newest-first placement.
 */
function groupKey(log: AuditLog): string {
  if (!isLifecycleAction(log.action)) {
    return `entry:${log.id}`;
  }
  return `resource:${log.resource_id ?? log.workspace_id ?? log.id}`;
}

function timeOf(log: AuditLog): number {
  const time = new Date(log.created_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Order audit logs for display.
 *
 * The feed reads newest-first, but the lifecycle events of one resource have to
 * read in causal order — "Workspace Created" before "Workspace Updated" — even
 * when the two happen within the same millisecond.
 *
 * Those two rules cannot be expressed as a single pairwise comparator: forcing
 * create-before-update while everything else sorts newest-first makes the
 * comparator cyclic (update < login < create < update), and `Array.sort` then
 * returns an arbitrary order that depends on which pairs it happens to compare.
 * So instead the events of a resource are collected into a group, ordered
 * causally inside it, and the group as a whole is placed in the feed by its most
 * recent event. Both sorts below are proper total orders.
 */
export function sortAuditLogs(logs: AuditLog[]): AuditLog[] {
  const groups = new Map<string, AuditLog[]>();

  for (const log of logs) {
    const key = groupKey(log);
    const existing = groups.get(key);
    if (existing) {
      existing.push(log);
    } else {
      groups.set(key, [log]);
    }
  }

  // Inside a resource: oldest first, so creation reads before the edits it enabled.
  for (const group of groups.values()) {
    group.sort((left, right) => {
      const byTime = timeOf(left) - timeOf(right);
      if (byTime !== 0) return byTime;

      const byLifecycle =
        (lifecycleRank[left.action] ?? 0) - (lifecycleRank[right.action] ?? 0);
      if (byLifecycle !== 0) return byLifecycle;

      return left.id.localeCompare(right.id);
    });
  }

  // Between resources: newest first, anchored on each group's most recent event.
  return [...groups.entries()]
    .sort(([leftKey, left], [rightKey, right]) => {
      const byAnchor = timeOf(right[right.length - 1]) - timeOf(left[left.length - 1]);
      if (byAnchor !== 0) return byAnchor;

      return leftKey.localeCompare(rightKey);
    })
    .flatMap(([, group]) => group);
}
