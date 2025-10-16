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
import { useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
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
  password_reset: "Password Reset",
  email_verification: "Email Verification",
};

/**
 * Admin Email Templates Page
 *
 * Super admin only page for managing system-wide email templates.
 * These templates are used across all workspaces for consistent branding.
 *
 * Security: Only super admins can access this page.
 */
export default function AdminEmailTemplatesPage() {
  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Email Templates" },
  ];

  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);

  // Fetch system-wide templates (not workspace-specific)
  // NOTE: Using "system" as placeholder workspace ID for system-wide templates
  // Backend currently requires workspace_id, but treats "system" specially
  // Future enhancement: Create dedicated system-wide endpoint (GET /admin/email-templates)
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["system-email-templates"],
    queryFn: () => {
      // Using "system" as special workspace_id for system-wide templates
      return apiClient.emailTemplates.list("system");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiClient.emailTemplates.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["system-email-templates"],
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
        queryKey: ["system-email-templates"],
      });
      toast.success("Template status updated");
    },
    onError: () => {
      toast.error("Failed to update template status");
    },
  });

  const handleSaveComplete = () => {
    queryClient.invalidateQueries({
      queryKey: ["system-email-templates"],
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
    <PageLayout
      title="System Email Templates"
      description="Manage system-wide email templates used across all workspaces"
      breadcrumbs={breadcrumbs}
      actions={
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      }
    >
      <AdminGuard>
        <div className="space-y-6">
          {/* Security Warning */}
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Super Admin Only
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                These email templates are used system-wide across all
                workspaces. Changes here affect all users. Ensure templates are
                professional, compliant, and thoroughly tested before
                activating.
              </p>
            </CardContent>
          </Card>

          {templates?.templates?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No custom templates
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create system-wide email templates for consistent
                  communication
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
                            <Badge variant="outline">System Default</Badge>
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
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create System Email Template</DialogTitle>
                <DialogDescription>
                  Create a system-wide email template used across all workspaces
                </DialogDescription>
              </DialogHeader>
              <EmailTemplateEditor
                workspaceId="system"
                onSave={handleSaveComplete}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog
            open={!!editingTemplate}
            onOpenChange={(open) => !open && setEditingTemplate(null)}
          >
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit System Email Template</DialogTitle>
                <DialogDescription>
                  Update the system-wide email template
                </DialogDescription>
              </DialogHeader>
              {editingTemplate && (
                <EmailTemplateEditor
                  workspaceId="system"
                  template={editingTemplate}
                  onSave={handleSaveComplete}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog
            open={!!deletingTemplate}
            onOpenChange={(open) => !open && setDeletingTemplate(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete System Email Template
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this system template? This
                  action cannot be undone. The system will fall back to the
                  default template for all workspaces.
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
      </AdminGuard>
    </PageLayout>
  );
}
