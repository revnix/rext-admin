"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Edit,
  History,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-states";
import { apiClient } from "@/lib/api-client";
import type { AuditLogDetail } from "@/types/audit-log";

interface RolePermissionAuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType?: "role" | "permission";
  resourceId?: string;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  assign: UserPlus,
  revoke: UserMinus,
  manage: Shield,
};

const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  create: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  update: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  delete: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  assign: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  revoke: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-200",
  },
};

export function RolePermissionAuditLog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
}: RolePermissionAuditLogProps) {
  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["audit-logs", resourceType, resourceId],
    queryFn: async () => {
      // Create query params
      const searchParams = new URLSearchParams();
      if (resourceType) {
        searchParams.append("resource_type", resourceType);
      }
      if (resourceId) {
        searchParams.append("resource_id", resourceId);
      }
      searchParams.append("limit", "50"); // Fetch the last 50 entries
      // Without this the list omits old_values/new_values/metadata entirely,
      // so every entry rendered as "No detailed changes available".
      searchParams.append("include_details", "true");

      const queryString = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "";

      const response = await apiClient.request<{
        items: AuditLogDetail[];
        total: number;
        has_more: boolean;
        limit: number;
        offset: number;
      }>(`/api/v1/audit-logs/${queryString}`, {
        method: "GET",
      });
      return response;
    },
    enabled: open,
  });

  const getActionIcon = (action: string) => {
    // Backend returns e.g. "role.create", we want "create"
    const parsedAction = action.includes(".")
      ? action.split(".").pop() || action
      : action;
    const Icon = ACTION_ICONS[parsedAction.toLowerCase()] || History;
    return Icon;
  };

  const getActionColors = (action: string) => {
    // Backend returns e.g. "role.create", we want "create"
    const parsedAction = action.includes(".")
      ? action.split(".").pop() || action
      : action;
    return (
      ACTION_COLORS[parsedAction.toLowerCase()] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
      }
    );
  };

  /**
   * Keys hidden from the raw value dump.
   *
   * The UUID lists stay in the stored audit record — they are the stable
   * reference if a permission is ever renamed — but they are unreadable on
   * screen and drown the entry. The human-readable names they correspond to
   * are already shown in the summary above.
   */
  const HIDDEN_CHANGE_KEYS = new Set([
    "permission_ids",
    "added_ids",
    "removed_ids",
    // Rendered as badges in the summary, so repeating them here is noise.
    "added_permissions",
    "removed_permissions",
  ]);

  /** Whether a value object has anything left to show once ids are hidden. */
  const hasVisibleChanges = (changes?: Record<string, unknown> | null) =>
    Object.keys(changes ?? {}).some((key) => !HIDDEN_CHANGE_KEYS.has(key));

  const renderChanges = (changes?: Record<string, unknown> | null) => {
    const visible = Object.entries(changes ?? {}).filter(
      ([key]) => !HIDDEN_CHANGE_KEYS.has(key),
    );

    if (visible.length === 0) {
      return (
        <span className="text-sm text-muted-foreground">
          No details available
        </span>
      );
    }

    return (
      <div className="space-y-1">
        {visible.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-sm">
            <span className="font-medium capitalize min-w-[100px]">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="text-muted-foreground break-all">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
            {resourceType && (
              <Badge variant="outline" className="capitalize">
                {resourceType}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Track all changes to roles and permissions for compliance and
            security
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4 py-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }, (_, i) => `loading-${i}`).map((key) => (
                <Card key={key}>
                  <CardHeader>
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <ErrorAlert
                title="Failed to load audit logs"
                message={
                  error instanceof Error ? error.message : "Request failed"
                }
                retry={() => void refetch()}
              />
            ) : auditData?.items && auditData.items.length > 0 ? (
              auditData.items.map((log) => {
                const Icon = getActionIcon(log.action);
                const colors = getActionColors(log.action);

                // The basic AuditLog doesn't have changes. It may have details from the generic getMyLogs
                // but the /api/v1/audit-logs/ endpoint doesn't strictly define it in basic list.
                // We'll safely access it by typecasting to AuditLogDetail if we want to show changes.
                const detailedLog = log as AuditLogDetail;

                // Turn the raw audit values into something a reviewer can read
                // at a glance. The backend records which permissions moved and
                // for which role; without this the card only said
                // "permission.update".
                const values = (detailedLog.new_values ?? {}) as Record<
                  string,
                  unknown
                >;
                const meta = (detailedLog.metadata ?? {}) as Record<
                  string,
                  unknown
                >;
                const addedPermissions = Array.isArray(values.added_permissions)
                  ? (values.added_permissions as string[])
                  : [];
                const removedPermissions = Array.isArray(
                  values.removed_permissions,
                )
                  ? (values.removed_permissions as string[])
                  : [];
                const affectedRole =
                  (meta.role_display_name as string) ||
                  (meta.role_name as string) ||
                  null;
                const hasPermissionSummary =
                  addedPermissions.length > 0 || removedPermissions.length > 0;

                // Role create/update/delete carry no permission diff, but the
                // role they acted on is still the useful fact to lead with.
                const isRoleAction = log.action.startsWith("role.");
                const roleActionVerb = log.action.split(".").pop();

                const hasChanges =
                  detailedLog.new_values &&
                  Object.keys(detailedLog.new_values).length > 0;

                return (
                  <Card
                    key={log.id}
                    className={`${colors.border} border-2 !w-[95%]`}
                  >
                    <CardHeader className={`${colors.bg} rounded-t-lg !p-3`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle
                          className={`text-base flex items-center flex-wrap gap-2 ${colors.text}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{log.action}</span>
                          <Badge variant="outline" className="capitalize">
                            {log.resource_type}
                          </Badge>
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "PPp")}
                        </span>
                      </div>
                      <CardDescription>
                        by <strong>{log.user_email || "System"}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {!hasPermissionSummary &&
                        isRoleAction &&
                        affectedRole && (
                          <p className="mb-3 text-sm">
                            Role <strong>{affectedRole}</strong> was{" "}
                            {roleActionVerb === "create"
                              ? "created"
                              : roleActionVerb === "delete"
                                ? "deleted"
                                : "updated"}
                          </p>
                        )}

                      {hasPermissionSummary && (
                        <div className="mb-3 space-y-2">
                          {affectedRole && (
                            <p className="text-sm">
                              Permissions updated for{" "}
                              <strong>{affectedRole}</strong>
                            </p>
                          )}

                          {addedPermissions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs font-medium text-green-600 dark:text-green-500">
                                Granted:
                              </span>
                              {addedPermissions.map((name) => (
                                <Badge
                                  key={`added-${name}`}
                                  variant="outline"
                                  className="font-mono text-[11px] border-green-600/40 text-green-700 dark:text-green-400"
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {removedPermissions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs font-medium text-destructive">
                                Revoked:
                              </span>
                              {removedPermissions.map((name) => (
                                <Badge
                                  key={`removed-${name}`}
                                  variant="outline"
                                  className="font-mono text-[11px] border-destructive/40 text-destructive"
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {hasChanges ? (
                        <div className="space-y-3">
                          {hasVisibleChanges(detailedLog.old_values) && (
                            <div>
                              <p className="text-xs font-medium mb-1 text-muted-foreground">
                                Previous Values:
                              </p>
                              {renderChanges(detailedLog.old_values)}
                            </div>
                          )}
                          {hasVisibleChanges(detailedLog.new_values) && (
                            <div>
                              <p className="text-xs font-medium mb-1 text-muted-foreground">
                                New Values:
                              </p>
                              {renderChanges(detailedLog.new_values)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No detailed changes available for this action
                        </span>
                      )}

                      {/* Metadata is not rendered: everything in it (role name,
                          operation, performing user) is already stated in the
                          summary and card header. It stays in the stored audit
                          record. */}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No audit logs found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Changes to roles and permissions will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
