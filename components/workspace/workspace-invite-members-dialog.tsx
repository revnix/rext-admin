"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Mail,
  Send,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldController } from "@/components/forms/field-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TruncatedTooltipText } from "@/components/ui/truncated-tooltip-text";
import { apiClient } from "@/lib/api-client";
import {
  type InviteMembersValues,
  inviteMembersSchema,
} from "@/schemas/workspace-schemas";

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

interface EmailChip {
  email: string;
  status: "valid" | "invalid" | "duplicate" | "existing" | "invited";
  message?: string;
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  const [emailChips, setEmailChips] = useState<EmailChip[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Fetch available roles (without permissions to avoid permission errors)
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["workspace-available-roles"],
    queryFn: () => apiClient.workspaces.getAvailableRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing members
  const { data: membersData } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => apiClient.members.list(workspaceId),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch pending invitations
  const { data: invitationsData } = useQuery({
    queryKey: ["sent-invitations", workspaceId],
    queryFn: () => apiClient.invitations.listSent(workspaceId),
    staleTime: 2 * 60 * 1000,
  });

  const roles = (rolesResponse?.roles || []).filter(
    (r) => r.name.toLowerCase() !== "workspace_owner",
  );
  const existingMembers = membersData?.members || [];
  const pendingInvitations = invitationsData?.invitations || [];

  // Find default role (Editor) or first non-system role
  const defaultRoleId =
    roles.find((r) => r.name.toLowerCase() === "editor")?.id ||
    roles.find((r) => !r.is_system_role)?.id ||
    "";

  const form = useZodForm(inviteMembersSchema, {
    defaultValues: {
      role_id: "",
      expires_in_days: 7,
    },
  });

  // Set default role when roles are loaded (using useEffect to avoid infinite loops)
  if (
    defaultRoleId &&
    !form.getValues("role_id") &&
    roles.length > 0 &&
    !isLoadingRoles
  ) {
    form.setValue("role_id", defaultRoleId, { shouldValidate: true });
  }

  // Validate email chip status
  const validateEmailChip = (email: string): EmailChip => {
    if (!isValidEmail(email)) {
      return { email, status: "invalid", message: "Invalid email format" };
    }

    // Check if already a member
    const isMember = existingMembers.some(
      (m) => m.user.email.toLowerCase() === email.toLowerCase(),
    );
    if (isMember) {
      return { email, status: "existing", message: "Already a member" };
    }

    // Check if already invited
    const isInvited = pendingInvitations.some(
      (i) =>
        i.email.toLowerCase() === email.toLowerCase() &&
        i.status.toLowerCase() === "pending",
    );
    if (isInvited) {
      return { email, status: "invited", message: "Already invited" };
    }

    // Check for duplicates in current chips
    const isDuplicate = emailChips.some(
      (c) => c.email.toLowerCase() === email.toLowerCase(),
    );
    if (isDuplicate) {
      return { email, status: "duplicate", message: "Duplicate email" };
    }

    return { email, status: "valid" };
  };

  // Handle paste multiple emails
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const emails = pastedText
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length > 1) {
      e.preventDefault();
      const newChips = emails.map((email) => validateEmailChip(email));
      setEmailChips([...emailChips, ...newChips]);
      setInputValue("");
    }
  };

  // Add email chip
  const addEmailChip = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const chip = validateEmailChip(trimmedEmail);
    setEmailChips([...emailChips, chip]);
    setInputValue("");
  };

  // Remove email chip
  const removeEmailChip = (index: number) => {
    setEmailChips(emailChips.filter((_, i) => i !== index));
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addEmailChip(inputValue);
    } else if (e.key === "Backspace" && !inputValue && emailChips.length > 0) {
      removeEmailChip(emailChips.length - 1);
    }
  };

  // Get chip badge variant
  const getChipBadgeVariant = (
    status: EmailChip["status"],
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "valid":
        return "default";
      case "invalid":
      case "duplicate":
        return "destructive";
      case "existing":
      case "invited":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get chip icon
  const getChipIcon = (status: EmailChip["status"]) => {
    switch (status) {
      case "valid":
        return <UserCheck className="h-3 w-3" />;
      case "invalid":
      case "duplicate":
        return <UserX className="h-3 w-3" />;
      case "existing":
        return <Users className="h-3 w-3" />;
      case "invited":
        return <Mail className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Valid emails count
  const validEmails = useMemo(
    () => emailChips.filter((c) => c.status === "valid"),
    [emailChips],
  );

  // Single/Bulk invitation mutation
  const createInvitationsMutation = useMutation({
    mutationFn: async (data: InviteMembersValues) => {
      const emails = validEmails.map((c) => c.email);

      if (emails.length === 0) {
        throw new Error("No valid emails to invite");
      }

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

  const onSubmit = async (data: InviteMembersValues) => {
    if (validEmails.length === 0) {
      toast.error("Please add at least one valid email address");
      return;
    }

    if (!data.role_id) {
      toast.error("Please select a role");
      return;
    }

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
    setEmailChips([]);
    setInputValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this workspace. Add multiple emails
            by pasting comma or newline-separated addresses.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          // Show results
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Invitation Results</h3>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.email}
                  className="flex items-start gap-2 p-3 rounded-md border"
                >
                  {result.status === "pending" ? (
                    <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.email}</p>
                    {result.status === "pending" ? (
                      <p className="text-sm text-success-600">
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
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Email Chips Input */}
            <div className="space-y-3">
              <Label htmlFor="invite-emails">Email addresses</Label>
              <div className="min-h-[100px] p-3 border-2 rounded-md focus-within:border-primary">
                <div className="flex flex-wrap gap-2">
                  {/* Email chips */}
                  {emailChips.map((chip, index) => (
                    <TruncatedTooltipText
                      key={chip.email}
                      trigger={
                        <Badge
                          variant={getChipBadgeVariant(chip.status)}
                          className="px-2 py-1 text-sm flex items-center gap-1"
                        >
                          {getChipIcon(chip.status)}
                          <span>{chip.email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1 hover:bg-transparent"
                            onClick={() => removeEmailChip(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      }
                      content={chip.message ? <p>{chip.message}</p> : null}
                    />
                  ))}

                  {/* Input field */}
                  <input
                    type="email"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                    }}
                    onKeyDown={handleInputKeyDown}
                    onPaste={handlePaste}
                    onBlur={() => {
                      if (inputValue.trim()) {
                        addEmailChip(inputValue);
                      }
                    }}
                    placeholder={
                      emailChips.length === 0
                        ? "colleague@example.com or paste multiple emails"
                        : "Add another email..."
                    }
                    disabled={isSubmitting || emailChips.length >= 50}
                    className="border-0 p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[200px] bg-transparent outline-none"
                    autoComplete="email"
                    id="invite-emails"
                    name="email-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Press Enter to add • Paste comma/newline-separated emails •
                  Max 50
                </p>
                <p>
                  {validEmails.length} valid{" "}
                  {emailChips.length > validEmails.length && (
                    <span className="text-warning-600">
                      • {emailChips.length - validEmails.length} invalid
                    </span>
                  )}
                </p>
              </div>

              {emailChips.some((c) => c.status !== "valid") && (
                <Notice tone="warning">
                  Some emails are invalid or already invited. Only valid emails
                  will be sent invitations.
                </Notice>
              )}
            </div>

            {/* Role Selection */}
            <FieldController
              control={form.control}
              name="role_id"
              label="Role"
              required
              description={
                validEmails.length > 1
                  ? "Every invited member joins with this role."
                  : "The role the invited member joins with."
              }
            >
              {(field) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || isLoadingRoles}
                >
                  <SelectTrigger
                    id={field.id}
                    aria-invalid={field["aria-invalid"]}
                    aria-describedby={field["aria-describedby"]}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue placeholder="Choose a role">
                      {field.value &&
                        roles.find((r) => r.id === field.value)?.display_name}
                    </SelectValue>
                  </SelectTrigger>
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
              )}
            </FieldController>

            {/* Expiration Days */}
            <FieldController
              control={form.control}
              name="expires_in_days"
              label="Invitation valid for"
              description={`How long the invitation ${validEmails.length > 1 ? "links stay" : "link stays"} valid.`}
            >
              {(field) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(Number(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id={field.id}
                    aria-invalid={field["aria-invalid"]}
                    aria-describedby={field["aria-describedby"]}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue placeholder="Choose how long" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days (recommended)</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FieldController>

            {validEmails.length > 1 && (
              <Notice>
                Each person will receive a separate email invitation. Failed
                invitations (duplicates, invalid emails, existing members) will
                be reported after submission.
              </Notice>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || validEmails.length === 0}
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send{" "}
                    {validEmails.length > 1
                      ? `${validEmails.length} Invitations`
                      : "Invitation"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
