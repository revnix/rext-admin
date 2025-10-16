"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Export Topic Action Component
 * Handles exporting topics in various formats
 */

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuccessAlert } from "@/components/ui/error-alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeneratedTopic } from "@/types/topic-builder";
import { useExportTopic } from "./hooks/useExportTopic";
import type { BaseActionProps, ExportFormat } from "./types";

interface ExportTopicActionProps extends BaseActionProps {
  onExport?: (
    topics: GeneratedTopic[],
    format: ExportFormat,
  ) => Promise<void> | void;
  variant?: "button" | "dropdown-item";
}

export function ExportTopicAction({
  topic,
  onExport,
  disabled = false,
  variant = "button",
}: ExportTopicActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { exportTopics, isExporting, exportFormat, setExportFormat } =
    useExportTopic();

  const handleExport = async () => {
    setError(undefined);
    setSuccess(undefined);

    const result = await exportTopics([topic], onExport);

    if (result.success) {
      setSuccess(result.message);
      setIsDialogOpen(false);
    } else {
      setError(result.message);
    }
  };

  if (variant === "dropdown-item") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="flex w-full items-center text-left"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Topic</DialogTitle>
              <DialogDescription>
                Choose the format to export this topic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) =>
                    setExportFormat(value as ExportFormat)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <SimpleErrorDisplay
                  message={error || ""}
                  onRetry={() => {
                    setError(undefined);
                    handleExport();
                  }}
                />
              )}
              {success && <SuccessAlert message={success} />}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isExporting}
        className="gap-1.5 cursor-pointer"
      >
        <Download className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Topic</DialogTitle>
            <DialogDescription>
              Choose the format to export this topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <SimpleErrorDisplay
                message={error || ""}
                onRetry={() => {
                  setError(undefined);
                  handleExport();
                }}
              />
            )}
            {success && <SuccessAlert message={success} />}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
