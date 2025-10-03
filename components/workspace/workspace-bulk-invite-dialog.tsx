"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Mail, Send, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { roleApiService, workspaceApiService } from "@/services";

const bulkInviteFormSchema = z.object({
  emails_text: z
    .string()
    .min(1, "Please enter at least one email address")
    .max(5000, "Input too large"),
  role_id: z.string().min(1, "Please select a role"),
  expires_in_days: z.number().int().min(1).max(30),
});

type BulkInviteFormValues = z.infer<typeof bulkInviteFormSchema>;

interface WorkspaceBulkInviteDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

interface InvitationResult {
  email: string;
  success: boolean;
  invitation_id?: string;
  error_message?: string;
}

export function WorkspaceBulkInviteDialog({
  workspaceId,
  open,
  onOpenChange,
  onInvited,
}: WorkspaceBulkInviteDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<InvitationResult[] | null>(null);

  // Fetch available roles
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleApiService.listRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesResponse?.roles || [];

  const form = useForm<BulkInviteFormValues>({
    resolver: zodResolver(bulkInviteFormSchema),
    defaultValues: {
      emails_text: "",
      role_id: "",
      expires_in_days: 7,
    },
  });

  // Parse emails from text input
  const parseEmails = (text: string): string[] => {
    // Split by common delimiters: comma, semicolon, newline, space
    const emails = text
      .split(/[,;\n\s]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    return [...new Set(emails)]; // Remove duplicates
  };

  // Create bulk invitations mutation
  const createBulkInvitationsMutation = useMutation({
    mutationFn: (data: BulkInviteFormValues) => {
      const emails = parseEmails(data.emails_text);
      return workspaceApiService.createBulkInvitations({
        workspace_id: workspaceId,
        emails,
        role_id: data.role_id,
        expires_in_days: data.expires_in_days,
      });
    },
    onSuccess: (data) => {
      setResults(data.results);

      if (data.failed === 0) {
        toast.success(`Successfully sent ${data.successful} invitations`);
      } else {
        toast.warning(
          `Sent ${data.successful} invitations, ${data.failed} failed`,
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["sent-invitations"] });

      if (data.failed === 0) {
        // Only close if all succeeded
        setTimeout(() => {
          form.reset();
          onOpenChange(false);
          setResults(null);
        }, 2000);
      }

      onInvited?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitations: ${error.message}`);
    },
  });

  const onSubmit = async (data: BulkInviteFormValues) => {
    const emails = parseEmails(data.emails_text);

    if (emails.length === 0) {
      form.setError("emails_text", {
        message: "No valid email addresses found",
      });
      return;
    }

    if (emails.length > 50) {
      form.setError("emails_text", {
        message: "Maximum 50 emails allowed",
      });
      return;
    }

    setIsSubmitting(true);
    setResults(null);
    try {
      await createBulkInvitationsMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setResults(null);
    onOpenChange(false);
  };

  const emailsPreview = parseEmails(form.watch("emails_text") || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Invite multiple people at once by entering their email addresses.
            Separate emails with commas, semicolons, spaces, or newlines.
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
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.email}</p>
                    {result.success ? (
                      <p className="text-sm text-green-600">
                        Invitation sent successfully
                      </p>
                    ) : (
                      <p className="text-sm text-destructive">
                        {result.error_message}
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
                  {results.filter((r) => r.success).length} successful,{" "}
                  {results.filter((r) => !r.success).length} failed
                </p>
              </div>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          // Show form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Input */}
              <FormField
                control={form.control}
                name="emails_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Addresses</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
                        className="min-h-[150px] font-mono text-sm"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter email addresses separated by commas, semicolons,
                      spaces, or newlines. Max 50 emails per request.
                    </FormDescription>
                    <FormMessage />
                    {emailsPreview.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">
                          {emailsPreview.length} email
                          {emailsPreview.length !== 1 ? "s" : ""} detected
                        </p>
                      </div>
                    )}
                  </FormItem>
                )}
              />

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
                      All invited members will receive this role
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
                      How long the invitation links will remain valid
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Each person will receive a separate email invitation. Failed
                  invitations (duplicates, invalid emails, existing members)
                  will be reported after submission.
                </AlertDescription>
              </Alert>

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
                      Send Invitations
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
