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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { log } from "@/lib/logger";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceStore } from "@/stores/workspace";
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

  const workspaceTimezone = useMemo(
    () =>
      workspace.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    [workspace.timezone],
  );

  const workspaceUrl = useMemo(() => workspace.url || "", [workspace.url]);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: workspaceTitle,
      timezone: workspaceTimezone,
      url: workspaceUrl,
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = form;

  useEffect(() => {
    reset({
      name: workspaceTitle,
      timezone: workspaceTimezone,
      url: workspaceUrl,
    });
  }, [workspaceTitle, workspaceTimezone, workspaceUrl, reset]);

  const handleReset = () => {
    reset({
      name: workspaceTitle,
      timezone: workspaceTimezone,
      url: workspaceUrl,
    });
  };

  const onSubmit = async (data: WorkspaceFormData) => {
    setIsSubmitting(true);
    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, data);

      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      toast.success(
        `Workspace "${getWorkspaceDisplayTitle(updatedWorkspace)}" updated successfully`,
      );

      reset({
        name: getWorkspaceDisplayTitle(updatedWorkspace, ""),
        timezone:
          updatedWorkspace.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone,
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
          Update the name, timezone, and URL for this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              placeholder="Enter workspace name"
              autoComplete="off"
              {...register("name")}
              disabled={isSubmitting}
              className={errors.name ? "border-destructive" : undefined}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
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
            <Label htmlFor="workspace-timezone">Timezone</Label>
            <Select
              value={form.watch("timezone") || ""}
              onValueChange={(value) =>
                form.setValue("timezone", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="workspace-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>North America</SelectLabel>
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Europe</SelectLabel>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Europe/Istanbul">
                    Istanbul (TRT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Asia</SelectLabel>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                  <SelectItem value="Asia/Karachi">Karachi (PKT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Asia/Singapore">
                    Singapore (SGT)
                  </SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Australia & Pacific</SelectLabel>
                  <SelectItem value="Australia/Sydney">
                    Sydney (AEDT)
                  </SelectItem>
                  <SelectItem value="Pacific/Auckland">
                    Auckland (NZDT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Other</SelectLabel>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.timezone.message}
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
