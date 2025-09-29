"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { workspaceApiService } from "@/services";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Edit Workspace Page
 *
 * Dedicated page for editing workspace details with full context display.
 * Uses React Hook Form with Zod validation for robust form handling.
 *
 * Features:
 * - Full page layout with proper navigation
 * - Workspace context display
 * - Real-time validation with Zod schema
 * - API integration with optimistic updates
 * - Error handling and success redirects
 */
export default function EditWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);

  // Query workspace data
  const {
    data: workspaceResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceApiService.getWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const workspace = workspaceResponse?.workspace;

  // Set up React Hook Form with Zod validation
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
  } = form;

  // Watch description for character count
  const watchedDescription = watch("description") || "";

  // Reset form with workspace data when loaded
  useEffect(() => {
    if (workspace) {
      reset({
        title: workspace.title || "",
        description: workspace.description ?? "", // Ensure description is always a string
        url: workspace.url || "",
      });
    }
  }, [workspace, reset]);

  // Update page title
  usePageTitle(
    workspace ? `Edit ${workspace.title}` : "Edit Workspace",
    "Update workspace details and settings",
  );

  // Form submission handler
  const onSubmit = async (data: WorkspaceFormData) => {
    if (!workspace) return;

    setIsSubmitting(true);
    try {
      // Ensure description is always a string for the API
      const updateData = {
        ...data,
        description: data.description ?? "",
      };

      // Call the workspace store update action
      const updatedWorkspace = await updateWorkspace(workspace.id, updateData);

      // Invalidate and refetch workspace data
      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      toast.success(
        `Workspace "${updatedWorkspace.title}" updated successfully`,
      );

      // Redirect back to workspace detail page
      router.push(`/workspaces/${workspaceId}`);
    } catch (error) {
      console.error("Failed to update workspace:", error);
      toast.error("Failed to update workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = confirm(
        "You have unsaved changes. Are you sure you want to cancel?",
      );
      if (!confirmed) return;
    }
    router.push(`/workspaces/${workspaceId}`);
  };

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "Loading...",
      href: `/workspaces/${workspaceId}`,
    },
    { label: "Edit" },
  ];

  const actions = (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-workspace-form"
        disabled={isSubmitting || !isValid || !isDirty}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );

  if (error) {
    return (
      <PageLayout
        title="Workspace Not Found"
        description="The requested workspace could not be found"
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        }
      >
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Failed to load workspace</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={workspace ? `Edit ${workspace.title}` : "Edit Workspace"}
      description="Update workspace details and settings"
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          <Link
            href={`/workspaces/${workspaceId}`}
            className="hover:text-foreground transition-colors"
          >
            Back to {workspace?.title || "Workspace"}
          </Link>
        </div>

        {/* Workspace Context Card */}
        {workspace && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Workspace</CardTitle>
              <CardDescription>
                You are editing the details for this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </p>
                </div>
                {workspace.updated_at && (
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <p className="font-medium">
                      {new Date(workspace.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">
                    Knowledge Items:
                  </span>
                  <p className="font-medium">
                    {(workspace.websites?.length || 0) +
                      (workspace.knowledge_files?.length || 0) +
                      (workspace.text_knowledge?.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Details</CardTitle>
            <CardDescription>
              Update the title, description, and URL for this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-20 w-full bg-muted animate-pulse rounded" />
                </div>
              </div>
            ) : (
              <form
                id="edit-workspace-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter workspace title"
                    {...register("title")}
                    disabled={isSubmitting}
                    className={errors.title ? "border-destructive" : ""}
                    autoFocus
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* URL Field */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Website URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    {...register("url")}
                    disabled={isSubmitting}
                    className={errors.url ? "border-destructive" : ""}
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Changing the URL may affect brand voice and content analysis
                  </p>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for your workspace"
                    {...register("description")}
                    disabled={isSubmitting}
                    className={`resize-none ${errors.description ? "border-destructive" : ""}`}
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {watchedDescription.length}/1000 characters
                  </p>
                </div>

                {/* Form Status */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {isDirty ? (
                      <span className="text-amber-600">
                        You have unsaved changes
                      </span>
                    ) : (
                      <span>No changes made</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isValid || !isDirty}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
