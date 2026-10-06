"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckEmail } from "@/components/auth/check-email";
import { InvitationBanner } from "@/components/auth/invitation-banner";
import { FieldController } from "@/components/forms/field-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { cn } from "@/lib/utils";
import { type SignupFormData, signupFormSchema } from "@/schemas/auth-schemas";
import { ApiError, apiClient } from "@/lib/api-client";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { checkPasswordBreach } from "@/lib/password-utils";
import { classifyError } from "@/lib/error-utils";
import type { Route } from "next";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  // Set once the account exists but can't log in until its email is verified.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Invitation validation hook
  const {
    invitationToken,
    invitation,
    isLoading: isLoadingInvitation,
    isValid: hasValidInvitation,
    error: invitationError,
  } = useInvitationValidation();

  const form = useZodForm(signupFormSchema, {
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { setValue } = form;
  const passwordValue = form.watch("password");

  // A new password re-checks a confirmation already typed, so a mismatch shows
  // (or clears) without leaving the field first.
  useEffect(() => {
    if (
      passwordValue !== undefined &&
      form.getFieldState("confirmPassword").isTouched
    ) {
      void form.trigger("confirmPassword");
    }
  }, [passwordValue, form]);

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation?.email) {
      setValue("email", invitation.email);
    }
  }, [invitation, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      // Check for breached password
      const breachResult = await checkPasswordBreach(data.password);
      if (breachResult.breached) {
        form.setError("password", {
          message: `This password has appeared in ${breachResult.count.toLocaleString()} data breaches. Please choose a different password.`,
        });
        setIsLoading(false);
        return;
      }
      // Determine which endpoint/method to use
      const isInvitationSignup = hasValidInvitation && !!invitationToken;

      // Build request payload
      const payload: Record<string, string> = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      };

      // Add invitation token if signing up via invitation
      if (isInvitationSignup && invitationToken) {
        payload.invitation_token = invitationToken;
      }

      // Register user with backend via apiClient
      const registerResult = isInvitationSignup
        ? await apiClient.users.registerWithInvitation(payload)
        : await apiClient.users.register(payload);

      // Some backend builds answer a duplicate-email register with HTTP 200 and
      // a bare `{ message }` body instead of an error status. Treat a response
      // without a created user as a failure so we don't falsely claim success.
      if (!registerResult?.user) {
        const msg =
          (registerResult as { message?: string })?.message ||
          "Account creation failed. Please try signing in instead.";
        throw new ApiError(400, msg);
      }

      analytics.track("user_signed_up", {
        method: isInvitationSignup ? "invitation" : "credentials",
      });

      // Login needs a verified email (the backend's REQUIRE_EMAIL_VERIFICATION), so a new account
      // that isn't verified can't be logged in yet: say where the link went instead of trying.
      if (registerResult.user.email_verified === false) {
        setVerifyEmail(data.email);
        return;
      }

      // Auto-login after successful registration. next-auth answers a refused login with `ok`
      // and an `error`, so both are read.
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        // Force refresh auth headers to ensure we have the new token
        await getAuthHeaders(true);
        toast.success("Account created successfully! Logging you in...");

        // Explicitly accept the invitation now that the user is authenticated.
        // The register-with-invitation endpoint creates the account but does not
        // reliably add the workspace membership, so drive the accept from here.
        if (isInvitationSignup && invitationToken) {
          try {
            const accepted =
              await apiClient.invitations.accept(invitationToken);
            if (accepted?.workspace_slug) {
              toast.success(`Welcome to ${accepted.workspace_name}!`);
              router.push(
                `/w/${accepted.workspace_slug}/generate_content` as Route,
              );
              return;
            }
          } catch (acceptError) {
            // Already a member / already accepted is fine - fall through to the
            // workspace lookup below. Surface anything else.
            const msg = acceptError instanceof Error ? acceptError.message : "";
            if (!/already|member|accepted/i.test(msg)) {
              log.error("[Signup] Failed to accept invitation:", acceptError);
              toast.error(
                `Failed to join workspace: ${msg || "Unknown error"}`,
              );
            }
          }
        }

        // Record account creation audit log
        try {
          // Attempt to get profile ID for the log
          const profileRes = await apiClient.request<{
            profile?: { id?: string };
            id?: string;
          }>("/api/v1/user/profile", { method: "GET" });
          const userId = profileRes?.profile?.id ?? profileRes?.id;

          await apiClient.request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "user.create",
              resource_type: "user",
              resource_id: userId,
              status: "success",
            }),
          });
        } catch (e) {
          log.error("[AuditLog] Failed to log user.create", e);
        }

        // Fetch workspaces to determine redirect
        try {
          const response = await apiClient.workspaces.list();
          const workspaces = response.workspaces || [];

          if (workspaces.length === 0) {
            // No workspace exists, redirect to create workspace
            router.push("/w/create" as Route);
          } else {
            // Workspace exists, redirect to generate content page
            const firstWorkspace = workspaces[0];
            router.push(`/w/${firstWorkspace.slug}/generate_content` as Route);
          }
        } catch (fetchError) {
          log.error(
            "[Signup] Failed to fetch workspaces after login:",
            fetchError,
          );
          // Fallback to dashboard on error
          router.push("/" as Route);
        }
      } else {
        // The account exists but the login was refused: most likely its email still needs
        // verifying. The same page says so and leads to the login form either way.
        setVerifyEmail(data.email);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Signup failed";

      // Account already exists - the user is trying to "create" an account they
      // already have. Point them at sign-in instead of showing a raw error, and
      // carry the invitation through so they still land in the workspace.
      const isDuplicateAccount =
        (ApiError.is(err) && err.statusCode === 409) ||
        /already (exists|registered|in use)|already have an account|email.*taken/i.test(
          errorMessage,
        );

      if (isDuplicateAccount) {
        const email = form.getValues("email");
        toast.error(
          "An account with this email already exists. Please sign in instead.",
        );
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (hasValidInvitation && invitationToken) {
          params.set("invitation_token", invitationToken);
        }
        const loginUrl = `/login?${params.toString()}`;
        router.push(loginUrl as Route);
        return;
      }

      const classifiedError = classifyError(err);
      const userMessage =
        classifiedError.type === "network_error" ||
        classifiedError.type === "server_error"
          ? classifiedError.message
          : errorMessage;

      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (verifyEmail) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <CheckEmail email={verifyEmail} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Invitation Banner */}
      {hasValidInvitation && invitation && (
        <InvitationBanner
          workspaceName={invitation.workspace?.name}
          workspaceSlug={invitation.workspace?.slug}
          inviterName={
            invitation.invited_by?.display_name ||
            invitation.invited_by?.full_name ||
            "Workspace Admin"
          }
          roleName={invitation.role?.display_name || invitation.role?.name}
          inviteeEmail={invitation.email}
          isLoading={isLoadingInvitation}
        />
      )}

      {/* Show invitation error if validation failed */}
      {invitationToken && !hasValidInvitation && !isLoadingInvitation && (
        <div className="space-y-1 rounded-md border border-border bg-surface-inset p-4 text-body text-foreground">
          <p className="font-medium">Invitation link issue</p>
          <p>
            {invitationError ||
              "This invitation link is invalid or has expired."}
          </p>
          <p>
            You can still create an account, but you won't be automatically
            added to the workspace.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {/* layout-ok: sign-up is outside the shell; its column carries the page's title */}
        <h1 className="font-display text-page-title text-foreground">
          {hasValidInvitation ? "Join the workspace" : "Create your account"}
        </h1>
        <p className="text-body text-muted-foreground">
          {hasValidInvitation
            ? "Complete your profile to join the workspace"
            : "Enter your details below to create your account"}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <FieldController
            control={form.control}
            name="full_name"
            label="Full name"
            required
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="name"
                placeholder="John"
                disabled={isLoading}
              />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="email"
            label="Email"
            description={
              hasValidInvitation ? "From your invitation" : undefined
            }
            required
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                disabled={isLoading}
                readOnly={hasValidInvitation}
              />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="password"
            label="Password"
            description="At least 8 characters."
            required
          >
            {(field) => (
              <PasswordInput
                {...field}
                autoComplete="new-password"
                disabled={isLoading}
              />
            )}
          </FieldController>

          <FieldController
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            required
          >
            {(field) => (
              <PasswordInput
                {...field}
                autoComplete="new-password"
                disabled={isLoading}
              />
            )}
          </FieldController>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingInvitation}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {hasValidInvitation
              ? "Create account and join the workspace"
              : "Create account"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-body text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
