"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { AuditLogFilters } from "@/types/audit-log";

interface DownloadAuditLogProps {
  filters?: AuditLogFilters;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function DownloadAuditLog({
  filters,
  variant = "outline",
  size = "sm",
}: DownloadAuditLogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Fetch audit logs data
      const data = await apiClient.auditLogs.getMyLogs({
        action: filters?.action,
        status: filters?.status,
        resource_type: filters?.resource_type,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        limit: 1000, // Get more data for export
        offset: 0,
      });

      if (!data?.logs || data.logs.length === 0) {
        toast.error("No activity data to download");
        return;
      }

      // Convert to CSV format
      const headers = [
        "Timestamp",
        "Action",
        "Resource Type",
        "Status",
        "IP Address",
        "User Agent",
      ];

      const rows = data.logs.map((log) => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.resource_type,
        log.status || "success",
        log.ip_address || "N/A",
        log.user_agent ? `"${log.user_agent.replace(/"/g, '""')}"` : "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const fileName = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${data.logs.length} activity records`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download activity log",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </>
      )}
    </Button>
  );
}
