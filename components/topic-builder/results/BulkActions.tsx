"use client";

import {
  BookmarkCheck,
  ChevronDown,
  Download,
  FileDown,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface BulkActionsProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  onSelectAll: (selected: boolean) => void;
  onBulkSave: (topicIds: string[]) => void;
  onBulkExport?: (topics: GeneratedTopic[], format: "json" | "csv") => void;
  onBulkDelete?: (topicIds: string[]) => void;
  className?: string;
}

export function BulkActions({
  topics,
  selectedTopicIds,
  onSelectAll,
  onBulkSave,
  onBulkExport,
  onBulkDelete,
  className,
}: BulkActionsProps) {
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalTopics = topics.length;
  const selectedCount = selectedTopicIds.length;
  const allSelected = selectedCount === totalTopics;
  const someSelected = selectedCount > 0 && selectedCount < totalTopics;

  const handleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  const handleBulkSave = async () => {
    if (selectedCount === 0) return;

    setIsBulkSaving(true);
    try {
      await onBulkSave(selectedTopicIds);
      console.log(`Bulk saved ${selectedCount} topics`);
    } catch (error) {
      console.error("Bulk save failed:", error);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleBulkExport = async (format: "json" | "csv") => {
    if (selectedCount === 0 || !onBulkExport) return;

    setIsBulkExporting(true);
    try {
      const selectedTopics = topics.filter((topic) =>
        selectedTopicIds.includes(topic.id),
      );
      await onBulkExport(selectedTopics, format);
      console.log(
        `Bulk exported ${selectedCount} topics as ${format.toUpperCase()}`,
      );
    } catch (error) {
      console.error(`Bulk export (${format}) failed:`, error);
    } finally {
      setIsBulkExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0 || !onBulkDelete) return;

    setIsBulkDeleting(true);
    try {
      await onBulkDelete(selectedTopicIds);
      console.log(`Bulk deleted ${selectedCount} topics`);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const getCheckboxState = () => {
    if (allSelected) return true;
    if (someSelected) return "indeterminate";
    return false;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-muted/20 border rounded-lg backdrop-blur-sm",
        className,
      )}
    >
      {/* Selection Controls */}
      <div className="flex items-center gap-4">
        {/* Select All Checkbox - Single checkbox only */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={getCheckboxState()}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            aria-label="Select all topics"
          />
          <span className="text-sm font-medium">
            {allSelected ? "Deselect All" : "Select All"}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Selection Counter */}
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span>
              <span className="font-medium text-foreground">
                {selectedCount}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalTopics}</span>{" "}
              topic{totalTopics !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No topics selected</span>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            {/* Save Button */}
            <Button
              onClick={handleBulkSave}
              disabled={isBulkSaving || selectedCount === 0}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <BookmarkCheck className="h-4 w-4" />
              {isBulkSaving
                ? `Saving ${selectedCount}...`
                : `Save Selected (${selectedCount})`}
            </Button>

            {/* Export Dropdown */}
            {onBulkExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBulkExporting || selectedCount === 0}
                    className="gap-1.5 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    {isBulkExporting ? "Exporting..." : "Export"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleBulkExport("json")}
                    disabled={isBulkExporting}
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkExport("csv")}
                    disabled={isBulkExporting}
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Delete Button */}
            {onBulkDelete && (
              <Button
                onClick={handleDeleteClick}
                disabled={isBulkDeleting || selectedCount === 0}
                variant="outline"
                size="sm"
                className="gap-1.5 shadow-sm text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {isBulkDeleting ? `Deleting ${selectedCount}...` : "Delete"}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Topics</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected topic
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? "Deleting..." : "Delete Topics"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
