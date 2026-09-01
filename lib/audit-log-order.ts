import { AuditActions } from "@/types/audit-log";
import type { AuditLog } from "@/types/audit-log";

const actionPriority: Record<string, number> = {
  [AuditActions.WORKSPACE_CREATE]: 0,
  [AuditActions.WORKSPACE_UPDATE]: 1,
  [AuditActions.WORKSPACE_DELETE]: 2,
  [AuditActions.USER_CREATE]: 0,
  [AuditActions.USER_UPDATE]: 1,
  [AuditActions.USER_DELETE]: 2,
};

export function sortAuditLogs(logs: AuditLog[]): AuditLog[] {
  return [...logs].sort((left, right) => {
    const leftResourceId = left.resource_id ?? left.workspace_id ?? left.id;
    const rightResourceId = right.resource_id ?? right.workspace_id ?? right.id;

    if (
      leftResourceId &&
      rightResourceId &&
      leftResourceId === rightResourceId
    ) {
      const leftActionPriority = actionPriority[left.action] ?? 10;
      const rightActionPriority = actionPriority[right.action] ?? 10;

      if (leftActionPriority !== rightActionPriority) {
        return leftActionPriority - rightActionPriority;
      }
    }

    return (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
  });
}
