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

interface RolePermissionAuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType?: "role" | "permission";
  resourceId?: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  user_email: string;
  timestamp: string;
  changes: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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
      // This would be your actual audit log API endpoint
      // For now, we'll use a placeholder
      const response = await apiClient.request<{
        logs: AuditLog[];
        count: number;
      }>("/api/v1/audit/logs", {
        method: "GET",
        // You'd add query params here to filter by resource_type and resource_id
      });
      return response;
    },
    enabled: open,
  });

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action.toLowerCase()] || History;
    return Icon;
  };

  const getActionColors = (action: string) => {
    return (
      ACTION_COLORS[action.toLowerCase()] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
      }
    );
  };

  const renderChanges = (changes: Record<string, unknown>) => {
    if (!changes || Object.keys(changes).length === 0) {
      return (
        <span className="text-sm text-muted-foreground">
          No details available
        </span>
      );
    }

    return (
      <div className="space-y-1">
        {Object.entries(changes).map(([key, value]) => (
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

        <ScrollArea className="h-[600px] pr-4">
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
            ) : auditData?.logs && auditData.logs.length > 0 ? (
              auditData.logs.map((log) => {
                const Icon = getActionIcon(log.action);
                const colors = getActionColors(log.action);

                return (
                  <Card key={log.id} className={`${colors.border} border-2`}>
                    <CardHeader className={`${colors.bg} rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <CardTitle
                          className={`text-base flex items-center gap-2 ${colors.text}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{log.action}</span>
                          <Badge variant="outline" className="capitalize">
                            {log.resource_type}
                          </Badge>
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "PPp")}
                        </span>
                      </div>
                      <CardDescription>
                        by <strong>{log.user_email}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {renderChanges(log.changes)}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-1">Metadata:</p>
                          <div className="text-xs text-muted-foreground">
                            {renderChanges(log.metadata)}
                          </div>
                        </div>
                      )}
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
