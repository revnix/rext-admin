"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { log } from "@/lib/logger";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";

interface WorkspaceOverviewFormProps {
  workspace: Workspace;
  onSuccess?: (updatedWorkspace: Workspace) => void;
  onError?: (error: unknown) => void;
  className?: string;
}

export function WorkspaceOverviewForm({
  workspace,
  onSuccess,
  onError,
  className,
}: WorkspaceOverviewFormProps) {
  const queryClient = useQueryClient();
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const workspaceTitle = useMemo(
    () => getWorkspaceDisplayTitle(workspace, "Untitled Workspace"),
    [workspace],
  );

  const workspaceDescription = useMemo(
    () => workspace.description ?? "",
    [workspace.description],
  );

  const workspaceUrl = useMemo(() => workspace.url || "", [workspace.url]);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      title: workspaceTitle,
      description: workspaceDescription,
      url: workspaceUrl,
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = form;

  const descriptionValue = watch("description") || "";

  useEffect(() => {
    reset({
      title: workspaceTitle,
      description: workspaceDescription,
      url: workspaceUrl,
    });
  }, [workspaceTitle, workspaceDescription, workspaceUrl, reset]);

  const handleReset = () => {
    reset({
      title: workspaceTitle,
      description: workspaceDescription,
      url: workspaceUrl,
    });
  };

  const onSubmit = async (data: WorkspaceFormData) => {
    setIsSubmitting(true);
    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, {
        ...data,
        description: data.description ?? "",
      });

      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      toast.success(
        `Workspace "${getWorkspaceDisplayTitle(updatedWorkspace)}" updated successfully`,
      );

      reset({
        title: getWorkspaceDisplayTitle(updatedWorkspace, ""),
        description: updatedWorkspace.description ?? "",
        url: updatedWorkspace.url || "",
      });

      onSuccess?.(updatedWorkspace);
    } catch (error) {
      log.error("Failed to update workspace:", error);
      toast.error("Failed to update workspace. Please try again.");
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Workspace Details</CardTitle>
        <CardDescription>
          Update the title, description, and URL for this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-title">Title</Label>
            <Input
              id="workspace-title"
              placeholder="Enter workspace title"
              autoComplete="off"
              {...register("title")}
              disabled={isSubmitting}
              className={errors.title ? "border-destructive" : undefined}
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-url">Website URL</Label>
            <Input
              id="workspace-url"
              type="url"
              placeholder="https://example.com"
              autoComplete="off"
              {...register("url")}
              disabled={isSubmitting}
              className={errors.url ? "border-destructive" : undefined}
            />
            {errors.url && (
              <p className="text-sm text-destructive" role="alert">
                {errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              placeholder="Optional description for your workspace"
              rows={4}
              {...register("description")}
              disabled={isSubmitting}
              className={errors.description ? "border-destructive" : undefined}
            />
            <p className="text-xs text-muted-foreground">
              {descriptionValue.length}/1000 characters
            </p>
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium">
                {new Date(workspace.created_at).toLocaleDateString()}
              </p>
            </div>
            {workspace.updated_at && (
              <div>
                <span className="text-muted-foreground">Last Updated</span>
                <p className="font-medium">
                  {new Date(workspace.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Knowledge Items</span>
              <p className="font-medium">
                {(workspace.websites?.length || 0) +
                  (workspace.knowledge_files?.length || 0) +
                  (workspace.text_knowledge?.length || 0)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Workspace ID</span>
              <p className="font-medium truncate" title={workspace.id}>
                {workspace.id}
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {isDirty ? "You have unsaved changes" : "All changes saved"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid || !isDirty}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
