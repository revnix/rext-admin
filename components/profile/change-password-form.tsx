"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES, passwordHas } from "@/schemas/auth-schemas";
import {
  type ChangePasswordFormData,
  changePasswordSchema,
} from "@/schemas/profile-schemas";

/**
 * How strong a new password reads, by how many of the five rules it meets, as the schema itself
 * reads them: "Strong" is said only of a password the form will take.
 */
export function strengthOf(password: string) {
  const has = passwordHas(password);
  const met = [
    has.length,
    has.lowercase,
    has.uppercase,
    has.number,
    has.symbol,
  ].filter(Boolean).length;
  if (met <= 2) return { label: "Weak", className: "text-danger-700" };
  // One too long for the backend's hashing is refused, whatever else it holds.
  if (met <= 4 || !has.fits) {
    return { label: "Fair", className: "text-warning-700" };
  }
  return { label: "Strong", className: "text-success-700" };
}

/**
 * The password change on Security (design/app-language.md §5): on the field set, checked when a
 * field loses focus and then as it changes; the schema holds the rules and the match.
 */
export function ChangePasswordForm() {
  const queryClient = useQueryClient();
  const form = useZodForm(changePasswordSchema, {
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      apiClient.profile.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (error: Error) => {
      toast.error(`The password wasn't changed: ${error.message}`);
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    await changePassword.mutateAsync(data).catch(() => undefined);
  };

  const newPassword = form.watch("newPassword");
  const strength = strengthOf(newPassword);

  return (
    <FormShell form={form} onSubmit={onSubmit} submitLabel="Change password">
      <div className="flex flex-col gap-4">
        <FieldController
          control={form.control}
          name="currentPassword"
          label="Current password"
          required
        >
          {(field) => (
            <PasswordInput {...field} autoComplete="current-password" />
          )}
        </FieldController>
        <FieldController
          control={form.control}
          name="newPassword"
          label="New password"
          required
          description={
            <>
              {PASSWORD_RULES}
              {newPassword && (
                <>
                  {" "}
                  Strength:{" "}
                  <span className={cn("font-medium", strength.className)}>
                    {strength.label}
                  </span>
                </>
              )}
            </>
          }
        >
          {(field) => <PasswordInput {...field} autoComplete="new-password" />}
        </FieldController>
        <FieldController
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          required
        >
          {(field) => <PasswordInput {...field} autoComplete="new-password" />}
        </FieldController>
      </div>
    </FormShell>
  );
}
