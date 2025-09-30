"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  ExternalLink,
  Globe,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webKnowledgeService } from "@/services/knowledge-api";
import { useWebKnowledgeStore } from "@/stores/knowledge-store";
import type { WebKnowledge } from "@/types/workspace";

interface WebKnowledgeCardProps {
  item: WebKnowledge;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

// Status configuration for display
const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary" as const,
    color: "text-slate-500",
  },
  scraping: {
    icon: Loader2,
    label: "Scraping",
    variant: "default" as const,
    color: "text-blue-500",
    animate: true,
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    variant: "default" as const,
    color: "text-blue-500",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "default" as const,
    color: "text-green-500",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "destructive" as const,
    color: "text-red-500",
  },
};

export function WebKnowledgeCard({
  item,
  onSelect,
  isSelected = false,
}: WebKnowledgeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const removeItem = useWebKnowledgeStore((state) => state.removeItem);
  const updateItem = useWebKnowledgeStore((state) => state.updateItem);

  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await webKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success("Web knowledge deleted successfully");
    } catch (error) {
      console.error("Failed to delete web knowledge:", error);
      toast.error("Failed to delete web knowledge");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      setIsUpdating(true);
      await webKnowledgeService.update(item.workspace_id, item.id, editTitle);
      updateItem(item.id, { ...item, title: editTitle });
      toast.success("Web knowledge updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update web knowledge:", error);
      toast.error("Failed to update web knowledge");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item.id);
    }
  };

  const formatCount = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon
                className={`h-4 w-4 ${status.color} ${
                  "animate" in status && status.animate ? "animate-spin" : ""
                }`}
              />
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium truncate">
              {item.title || "Untitled"}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3 w-3" />
                {item.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open URL
              </DropdownMenuItem>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Title
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>Edit Web Knowledge</DialogTitle>
                    <DialogDescription>
                      Update the title for this web knowledge item.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Enter title"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTitle(item.title || "");
                        setIsEditing(false);
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Web Knowledge</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this web knowledge? This
                      will remove the URL and all associated content from your
                      workspace. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Content Statistics */}
          {item.status === "completed" &&
            (item.char_count || item.word_count) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {item.word_count && (
                  <span>{formatCount(item.word_count)} words</span>
                )}
                {item.char_count && (
                  <span>{formatCount(item.char_count)} characters</span>
                )}
              </div>
            )}

          {/* Error Message */}
          {item.status === "failed" && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              Failed to scrape content from this URL. Please check if the URL is
              accessible and try again.
            </div>
          )}

          {/* Processing Information */}
          {(item.status === "scraping" || item.status === "processing") && (
            <div className="text-xs text-muted-foreground">
              {item.status === "scraping"
                ? "Extracting content from the webpage..."
                : "Processing content for vector storage..."}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground">
            Added {new Date(item.created_at).toLocaleDateString()}
            {item.updated_at && (
              <span>
                {" "}
                • Updated {new Date(item.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// List view variant
export function WebKnowledgeListItem({
  item,
  onSelect,
  isSelected = false,
}: WebKnowledgeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const removeItem = useWebKnowledgeStore((state) => state.removeItem);

  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await webKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success("Web knowledge deleted successfully");
    } catch (error) {
      console.error("Failed to delete web knowledge:", error);
      toast.error("Failed to delete web knowledge");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleItemClick = () => {
    if (onSelect) {
      onSelect(item.id);
    }
  };

  const formatCount = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <button
      type="button"
      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-left w-full ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleItemClick}
    >
      <div className="flex items-center gap-2">
        <StatusIcon
          className={`h-4 w-4 ${status.color} ${
            "animate" in status && status.animate ? "animate-spin" : ""
          }`}
        />
        <Badge variant={status.variant} className="text-xs">
          {status.label}
        </Badge>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{item.title || "Untitled"}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline inline-flex items-center gap-1 truncate max-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="h-3 w-3" />
            {item.url}
            <ExternalLink className="h-3 w-3" />
          </a>
          {item.status === "completed" && (
            <>
              {item.word_count && (
                <span>{formatCount(item.word_count)} words</span>
              )}
              {item.char_count && (
                <span>{formatCount(item.char_count)} chars</span>
              )}
            </>
          )}
          <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open URL
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Web Knowledge</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this web knowledge? This will
                  remove the URL and all associated content from your workspace.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  );
}
