"use client";

import {
  BookmarkCheck,
  ChevronDown,
  Download,
  FileDown,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const visibleSelectedCount = topics.filter((topic) =>
    selectedTopicIds.includes(topic.id),
  ).length;
  const allSelected = selectedCount === totalTopics && totalTopics > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalTopics;

  const handleSelectAll = useCallback(() => {
    onSelectAll(!allSelected);
  }, [onSelectAll, allSelected]);

  const handleBulkSave = useCallback(async () => {
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
  }, [selectedCount, onBulkSave, selectedTopicIds]);

  const handleBulkExport = useCallback(
    async (format: "json" | "csv") => {
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
    },
    [selectedCount, onBulkExport, topics, selectedTopicIds],
  );

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

  // Keyboard shortcuts for bulk operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when bulk actions area is focused or selected topics exist
      if (selectedCount === 0) return;

      // Cmd/Ctrl + A to select/deselect all
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      // Cmd/Ctrl + S to save selected
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "s" &&
        selectedCount > 0
      ) {
        event.preventDefault();
        handleBulkSave();
        return;
      }

      // Cmd/Ctrl + E to export selected
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "e" &&
        selectedCount > 0 &&
        onBulkExport
      ) {
        event.preventDefault();
        handleBulkExport("json");
        return;
      }

      // Escape to clear selection
      if (event.key === "Escape" && selectedCount > 0) {
        event.preventDefault();
        onSelectAll(false);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCount,
    onSelectAll,
    onBulkExport,
    handleBulkSave,
    handleBulkExport,
    handleSelectAll,
  ]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center justify-between p-4 bg-muted/20 border rounded-lg backdrop-blur-sm",
          className,
        )}
        role="toolbar"
        aria-label="Bulk actions toolbar"
      >
        {/* Selection Controls */}
        <div className="flex items-center gap-4">
          {/* Select All Checkbox - Single checkbox only */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={getCheckboxState()}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              aria-label={`${allSelected ? "Deselect" : "Select"} all ${totalTopics} topics (Ctrl/Cmd + A)`}
            />
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
              aria-label={`${allSelected ? "Deselect" : "Select"} all topics`}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Clear Selection Button - only show when there are hidden selected items */}
          {selectedCount > 0 && visibleSelectedCount < selectedCount && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAll(false)}
              className="text-muted-foreground hover:text-foreground"
              title="Clear all selections (Escape)"
            >
              Clear Selection
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Selection Counter */}
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <span>
                <span className="font-medium text-foreground">
                  {visibleSelectedCount}
                </span>
                {visibleSelectedCount !== selectedCount && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({selectedCount} total)
                  </span>
                )}{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalTopics}
                </span>{" "}
                visible topic{totalTopics !== 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>No topics selected</span>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          {selectedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Keyboard shortcuts help</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-xs space-y-1">
                  <div>
                    <kbd className="font-mono">Ctrl/Cmd + A</kbd>{" "}
                    Select/Deselect All
                  </div>
                  <div>
                    <kbd className="font-mono">Ctrl/Cmd + S</kbd> Save Selected
                  </div>
                  <div>
                    <kbd className="font-mono">Ctrl/Cmd + E</kbd> Export as JSON
                  </div>
                  <div>
                    <kbd className="font-mono">Escape</kbd> Clear Selection
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
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
                title="Save selected topics (Ctrl/Cmd + S)"
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
                      title="Export selected topics (Ctrl/Cmd + E for JSON)"
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
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
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
    </TooltipProvider>
  );
}
