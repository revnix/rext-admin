"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FieldController } from "@/components/forms/field-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import {
  type AdminInvitationValues,
  adminInvitationSchema,
} from "@/schemas/admin-schemas";
import { ADMIN_ROLES } from "@/types/admin-invitation";

interface CreateAdminInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Invite a platform administrator: a dialog on the field set, its own footer holding the buttons. */
export function CreateAdminInvitationDialog({
  open,
  onOpenChange,
}: CreateAdminInvitationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useZodForm(adminInvitationSchema, {
    defaultValues: {
      email: "",
      admin_role: "support",
      message: "",
      expiry_days: 7,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminInvitationValues) =>
      apiClient.adminInvitations.create(data),
    onSuccess: (data) => {
      // A 201 means the email went out: when it can't be sent the server keeps nothing and
      // says so (task 915).
      toast.success(`Admin invitation sent to ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(`The invitation wasn't sent: ${error.message}`);
    },
  });

  const onSubmit = async (data: AdminInvitationValues) => {
    await createMutation.mutateAsync(data).catch(() => undefined);
  };
  const submitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a platform administrator</DialogTitle>
          <DialogDescription>
            An invitation that grants administrative access to the platform.
            Only super admins can send one. The email's link works once, until
            it expires; the person must sign in or sign up with exactly this
            address, verified.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldController
            control={form.control}
            name="email"
            label="Email"
            required
            description="The address of the person you're inviting."
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="off"
                placeholder="admin@example.com"
              />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="admin_role"
            label="Admin role"
            required
            description="The administrative role and its permissions."
          >
            {(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={field.id}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="message"
            label="Personal message"
            description="Added to the invitation email. Optional."
            maxLength={1000}
          >
            {(field) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Welcome to the team!"
              />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="expiry_days"
            label="Expires in"
            description="How long the invitation stays valid."
          >
            {(field) => (
              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
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
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FieldController>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
