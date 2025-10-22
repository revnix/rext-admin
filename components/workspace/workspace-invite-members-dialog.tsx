"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Mail, Plus, Send, X } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

const inviteFormSchema = z.object({
  emails: z
    .array(
      z.object({
        value: z.string().email("Please enter a valid email address"),
      }),
    )
    .min(1, "Please add at least one email address"),
  role_id: z.string().min(1, "Please select a role"),
  expires_in_days: z.number().int().min(1).max(30),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface WorkspaceInviteMembersDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

interface InvitationResult {
  id: string;
  email: string;
  status: "pending" | "failed";
  error_message?: string;
}

export function WorkspaceInviteMembersDialog({
  workspaceId,
  open,
  onOpenChange,
  onInvited,
}: WorkspaceInviteMembersDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<InvitationResult[] | null>(null);

  // Fetch available roles for workspace member invitations
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["workspace-available-roles"],
    queryFn: () => apiClient.workspaces.getAvailableRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesResponse?.roles || [];

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: [{ value: "" }],
      role_id: "",
      expires_in_days: 7,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails",
  });

  // Single/Bulk invitation mutation
  const createInvitationsMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const emails = data.emails.map((e) => e.value.trim()).filter(Boolean);

      if (emails.length === 1) {
        // Single invitation
        const result = await apiClient.invitations.create(workspaceId, {
          email: emails[0],
          role_id: data.role_id,
          expiry_days: data.expires_in_days,
        });
        return {
          successful: 1,
          failed: 0,
          results: [
            {
              invitation_id:
                result.invitation?.id || `${emails[0]}-${Date.now()}`,
              email: emails[0],
              success: true,
            },
          ],
        };
      } else {
        // Bulk invitation
        return await apiClient.invitations.createBulk(workspaceId, {
          emails,
          role_id: data.role_id,
          expiry_days: data.expires_in_days,
        });
      }
    },
    onSuccess: (data) => {
      const emailCount = data.results.length;

      setResults(
        data.results.map((result) => ({
          id: result.invitation_id ?? `${result.email}-${Date.now()}`,
          email: result.email,
          status: result.success ? "pending" : "failed",
          error_message:
            "error_message" in result ? result.error_message : undefined,
        })),
      );

      if (data.failed === 0) {
        toast.success(
          emailCount === 1
            ? "Invitation sent successfully"
            : `Successfully sent ${data.successful} invitations`,
        );
      } else {
        toast.warning(
          `Sent ${data.successful} invitations, ${data.failed} failed`,
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sent-invitations", workspaceId],
      });

      if (data.failed === 0) {
        // Only close if all succeeded
        setTimeout(() => {
          handleClose();
        }, 2000);
      }

      onInvited?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitations: ${error.message}`);
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true);
    setResults(null);
    try {
      await createInvitationsMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setResults(null);
    onOpenChange(false);
  };

  const handleAddEmail = () => {
    append({ value: "" });
  };

  const handleRemoveEmail = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const validEmails = fields.filter((_field, index) => {
    const value = form.watch(`emails.${index}.value`);
    return value && value.trim().length > 0;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this workspace. Add multiple emails
            to send invitations in bulk.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          // Show results
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Invitation Results</h3>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.email}-${index}`}
                  className="flex items-start gap-2 p-3 rounded-md border"
                >
                  {result.status === "pending" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.email}</p>
                    {result.status === "pending" ? (
                      <p className="text-sm text-green-600">
                        Invitation sent successfully
                      </p>
                    ) : (
                      <p className="text-sm text-destructive">
                        {result.error_message ?? "Failed to send invitation"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <p className="text-sm font-medium">
                  Total: {results.length} emails processed
                </p>
                <p className="text-xs text-muted-foreground">
                  {results.filter((r) => r.status === "pending").length}{" "}
                  successful,{" "}
                  {results.filter((r) => r.status !== "pending").length} failed
                </p>
              </div>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          // Show form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Fields */}
              <div className="space-y-3">
                <FormLabel>Email Addresses</FormLabel>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`emails.${index}.value`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <div className="flex items-start gap-2">
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="colleague@example.com"
                                {...inputField}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEmail(index)}
                                disabled={isSubmitting}
                                className="flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmail}
                  disabled={isSubmitting || fields.length >= 50}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Email {fields.length >= 50 && "(Max 50)"}
                </Button>

                {validEmails > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {validEmails} email{validEmails !== 1 ? "s" : ""} will be
                    invited
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting || isLoadingRoles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles
                          .filter((role) => !role.is_system_role)
                          .map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {role.display_name}
                                </span>
                                {role.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {role.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {validEmails > 1
                        ? "All invited members will receive this role"
                        : "Choose the role for the invited member"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiration Days */}
              <FormField
                control={form.control}
                name="expires_in_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Validity (Days)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select validity period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days (recommended)</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How long the invitation{" "}
                      {validEmails > 1 ? "links" : "link"} will remain valid
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {validEmails > 1 && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Each person will receive a separate email invitation. Failed
                    invitations (duplicates, invalid emails, existing members)
                    will be reported after submission.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {validEmails > 1 ? "Invitations" : "Invitation"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
