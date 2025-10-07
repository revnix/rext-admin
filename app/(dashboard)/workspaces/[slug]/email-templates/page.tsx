"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailTemplateEditor } from "@/components/workspace/email-template-editor";
import { apiClient, type EmailTemplate } from "@/lib/api-client";

const templateTypeLabels: Record<string, string> = {
  workspace_invitation: "Workspace Invitation",
  invitation_accepted: "Invitation Accepted",
  role_changed: "Role Changed",
  member_removed: "Member Removed",
  welcome: "Welcome",
};

export default function EmailTemplatesPage() {
  const params = useParams();
  const workspaceSlug = params?.slug as string;
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);

  // Fetch workspace by slug to get ID
  const { data: workspaceResponse } = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () => apiClient.workspaces.getBySlug(workspaceSlug),
    enabled: !!workspaceSlug,
  });

  const workspaceId = workspaceResponse?.workspace?.id;

  // Fetch templates
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["email-templates", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return apiClient.emailTemplates.list(workspaceId);
    },
    enabled: !!workspaceId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiClient.emailTemplates.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email-templates", workspaceId],
      });
      toast.success("Template deleted successfully");
      setDeletingTemplate(null);
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({
      templateId,
      isActive,
    }: {
      templateId: string;
      isActive: boolean;
    }) => apiClient.emailTemplates.update(templateId, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email-templates", workspaceId],
      });
      toast.success("Template status updated");
    },
    onError: () => {
      toast.error("Failed to update template status");
    },
  });

  const handleSaveComplete = () => {
    queryClient.invalidateQueries({
      queryKey: ["email-templates", workspaceId],
    });
    setIsCreateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = () => {
    if (deletingTemplate) {
      deleteMutation.mutate(deletingTemplate.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold">
            Failed to load templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Customize email notifications for your workspace
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {templates?.templates?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No custom templates</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create custom email templates to personalize notifications
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates?.templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {templateTypeLabels[template.template_type] ||
                        template.template_type}
                      {template.is_default && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      {template.is_active ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{template.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          templateId: template.id,
                          isActive: template.is_active,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                    >
                      {template.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingTemplate(template)}
                      disabled={template.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(template.created_at).toLocaleDateString()}
                  </div>
                  {template.updated_at !== template.created_at && (
                    <div className="text-sm">
                      <span className="font-medium">Last updated:</span>{" "}
                      {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mt-4 rounded-md border bg-muted p-4">
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                      {template.body}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {workspaceId && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a custom email template for your workspace notifications
              </DialogDescription>
            </DialogHeader>
            <EmailTemplateEditor
              workspaceId={workspaceId}
              onSave={handleSaveComplete}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {workspaceId && (
        <Dialog
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Update your custom email template
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <EmailTemplateEditor
                workspaceId={workspaceId}
                template={editingTemplate}
                onSave={handleSaveComplete}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone. The system will fall back to the default template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
