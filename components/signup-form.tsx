"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { LegalAgreement } from "@/components/auth/legal-agreement";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckEmail } from "@/components/auth/check-email";
import { InvitationBanner } from "@/components/auth/invitation-banner";
import { SignupTrialLine } from "@/components/auth/signup-trial-line";
import { FieldController } from "@/components/forms/field-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/oauth-buttons";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { cn } from "@/lib/utils";
import { type SignupFormData, signupFormSchema } from "@/schemas/auth-schemas";
import { ApiError, apiClient } from "@/lib/api-client";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
import {
  firstRefusedField,
  isDuplicateAccount,
  SIGN_UP_FIELDS,
  signInRefusal,
  signUpRefusal,
} from "@/lib/analytics-forms";
import { useFormProgress } from "@/hooks/use-form-progress";
import { useToast } from "@/hooks/use-toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { checkPasswordBreach } from "@/lib/password-utils";
import { classifyError } from "@/lib/error-utils";
import type { Route } from "next";
import { workspaceRoutes } from "@/lib/routes";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const hydrated = useHydrated();
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
  // An invitation counts until it's known to be invalid: while it's checked, Google and GitHub keep
  // it, and the trial line waits rather than flashing.
  const joinsWorkspace =
    !!invitationToken && (hasValidInvitation || isLoadingInvitation);

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

  // This page is never recorded: the form says how far a person got in it, and what turned them
  // away, by kind (lib/analytics-forms.ts).
  const invited = hasValidInvitation && !!invitationToken;
  const progress = useFormProgress({
    started: "signup_started",
    fieldFilled: "signup_field_filled",
    fields: SIGN_UP_FIELDS,
    properties: { method: "credentials", invited },
  });

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
    analytics.track("signup_submitted", { method: "credentials", invited });
    // Once the account exists, what goes wrong after it is no refusal of the sign-up.
    let created = false;

    try {
      // Check for breached password
      const breachResult = await checkPasswordBreach(data.password);
      if (breachResult.breached) {
        analytics.track("signup_refused", {
          kind: "password_breached",
          field: SIGN_UP_FIELDS.password,
          invited,
        });
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

      created = true;
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
                workspaceRoutes.generate_content(
                  accepted.workspace_slug,
                ) as Route,
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

        // No audit write here: the backend's register endpoints record user.create themselves,
        // for an account that must verify its email too.

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
            router.push(
              workspaceRoutes.generate_content(firstWorkspace.slug) as Route,
            );
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
        // The account exists and is verified, but the login after sign-up was refused: say so
        // and take the user to the login form with the address filled in.
        analytics.track("signin_refused", {
          kind: signInRefusal(result?.code),
          after_sign_up: true,
        });
        toast.error(
          "Your account is ready, but logging in didn't work. Log in to continue.",
        );
        router.push(`/login?email=${encodeURIComponent(data.email)}` as Route);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Signup failed";
      if (created) {
        // The account exists: what failed is the login that follows it.
        analytics.track("signin_refused", {
          kind: signInRefusal(err instanceof Error ? err.message : null),
          after_sign_up: true,
        });
      } else {
        analytics.track("signup_refused", { ...signUpRefusal(err), invited });
      }

      // Account already exists - the user is trying to "create" an account they
      // already have. Point them at sign-in instead of showing a raw error, and
      // carry the invitation through so they still land in the workspace.
      if (isDuplicateAccount(err)) {
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
        {/* An invitation joins a workspace that already has its plan: no trial to name. */}
        {!joinsWorkspace && <SignupTrialLine />}
      </div>

      {/* The same ways in as login, with the same terms; an invitation still lands on its accept page. */}
      <OAuthButtons
        callbackUrl={
          joinsWorkspace && invitationToken
            ? `/invitations/accept?token=${encodeURIComponent(invitationToken)}`
            : "/"
        }
        notice={<LegalAgreement action="continuing with Google or GitHub" />}
        signUp
      />

      {/* A submit before the page runs is the browser's own: post keeps the fields out of the address. */}
      <form
        method="post"
        onSubmit={form.handleSubmit(onSubmit, (errors) =>
          analytics.track("signup_refused", {
            kind: "form",
            field: firstRefusedField(errors, SIGN_UP_FIELDS),
            invited,
          }),
        )}
        noValidate
        {...progress}
      >
        <FieldGroup>
          <FieldController
            control={form.control}
            name="full_name"
            label="Full name"
            required
          >
            {(field) => (
              <Input {...field} autoComplete="name" disabled={isLoading} />
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
                placeholder="you@company.com"
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
            data-rec="show"
            type="submit"
            className="w-full"
            disabled={!hydrated || isLoading || isLoadingInvitation}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {hasValidInvitation
              ? "Create account and join the workspace"
              : "Create account"}
          </Button>
        </FieldGroup>
      </form>

      <LegalAgreement action="creating an account" />

      <p className="text-center text-body text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium link">
          Log in
        </Link>
      </p>
    </div>
  );
}
