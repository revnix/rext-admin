"use client";

import Link from "next/link";
import { getAuthHeaders, resetAuthRedirectState } from "@/lib/auth-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { InvitationBanner } from "@/components/auth/invitation-banner";
import { FieldController } from "@/components/forms/field-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { apiClient } from "@/lib/api-client";
import { analytics } from "@/lib/analytics";
import { classifyError } from "@/lib/error-utils";
import { type LoginData, loginSchema } from "@/schemas/auth-schemas";
import type { Route } from "next";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useZodForm(loginSchema, {
    defaultValues: { email: "", password: "" },
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Invitation validation hook
  const {
    invitationToken,
    invitation,
    isLoading: isLoadingInvitation,
    isValid: hasValidInvitation,
    error: invitationError,
  } = useInvitationValidation();

  // Prefill email from the URL (e.g. redirected here from an invitation signup
  // because the account already exists).
  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) form.setValue("email", prefill);
  }, [searchParams, form]);

  // Handle URL error parameters (e.g., session expired)
  useEffect(() => {
    const urlError = searchParams.get("error");
    const errorCode = searchParams.get("code");

    if (urlError) {
      const errorMessages: Record<string, string> = {
        SessionExpired: "Your session has expired. Please log in again.",
        AccountSuspended:
          "Your account has been suspended. Contact support to have it reviewed.",
        AccountBanned:
          "Your account has been banned. Please contact support for assistance.",
        OAuthSignin: "Error occurred during OAuth sign in.",
        OAuthCallback: "Error occurred during OAuth callback.",
        OAuthCreateAccount: "Could not create OAuth account.",
        EmailCreateAccount: "Could not create email account.",
        Callback: "Error occurred during callback.",
        OAuthAccountNotLinked:
          "To confirm your identity, sign in with the same account you used originally.",
        EmailSignin: "Check your email for the sign in link.",
        CredentialsSignin:
          "Sign in failed. Check the details you provided are correct.",
        Default: "An error occurred during authentication.",
      };

      // Use errorCode if it's a descriptive message (not generic)
      const message =
        urlError === "CredentialsSignin" &&
        errorCode &&
        errorCode !== "credentials"
          ? errorCode
          : errorMessages[urlError] || errorMessages.Default;

      toast.error(message);
    }
  }, [searchParams, toast]);

  /** Whether it signed in: then it navigates, and the form stays busy until the next page shows. */
  const attemptSignIn = async ({
    email,
    password,
  }: LoginData): Promise<boolean> => {
    // Backend validated successfully, now use NextAuth for session creation.
    // There is deliberately no "confirm reactivation" flag here — a deactivated
    // account is only reactivated by opening the emailed link.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      // signIn() otherwise uses window.location.href, and reads `error` back
      // from it — on /login?error=SessionExpired a successful login would
      // report that stale error. Navigation is handled manually below.
      redirectTo: "/",
      rememberMe: rememberMe.toString(),
    });

    if (result?.error) {
      if (result.code === "ACCOUNT_DEACTIVATED") {
        // Reactivation is deliberately NOT granted by signing in again: the
        // password alone doesn't prove the mailbox owner wants the account
        // back. We email a single-use link instead, and /account-recovery
        // reactivates the account when it's opened.
        const shouldReactivate = await confirm({
          title: "Reactivate your account?",
          description:
            "This account was deactivated. We'll email you a link to confirm it's you — your account is reactivated as soon as you open it, then you can log in.",
          confirmText: "Email me the link",
          cancelText: "Cancel",
        });

        if (shouldReactivate) {
          try {
            // Always reports success, so it can't be used to probe which
            // addresses have accounts.
            await apiClient.account.requestRecovery({ email });
            toast.success(
              "Check your inbox for the reactivation link. It's valid for 30 minutes.",
            );
          } catch {
            toast.error(
              "Couldn't send the reactivation email. Please try again.",
            );
          }
        }
        return false;
      }

      // Use the error message from the backend if available (stored in result.code)
      // Fallback to a generic message if result.code is just "CredentialsSignin" or missing
      const errorMessage =
        result.code && result.code !== "CredentialsSignin"
          ? result.code
          : "Authentication failed. Please check your credentials and try again.";
      const classifiedError = classifyError(
        new Error(result.code || result.error || "Authentication failed"),
      );
      const displayErrorMessage =
        classifiedError.type === "network_error" ||
        classifiedError.type === "server_error"
          ? classifiedError.message
          : errorMessage;

      const isInvalidCredentials = displayErrorMessage
        .toLowerCase()
        .includes("invalid email or password");

      // Wrong details are the field's error, beside the field; anything else
      // (the server, the network, a locked account) is a toast.
      if (isInvalidCredentials) {
        form.setError(
          "password",
          { type: "server", message: displayErrorMessage },
          { shouldFocus: true },
        );
        return false;
      }

      toast.error(displayErrorMessage);
      return false;
    }

    toast.success("Login successful!");
    analytics.track("user_signed_in", { method: "credentials" });
    resetAuthRedirectState();

    if (hasValidInvitation && invitationToken) {
      // Force a fresh auth-headers read before navigating so the accept page's
      // very first request doesn't race the session hydration.
      await getAuthHeaders(true);
      router.push(`/invitations/accept?token=${invitationToken}` as Route);
    } else {
      await getAuthHeaders(true);

      try {
        const response = await apiClient.workspaces.list();
        const workspaces = response.workspaces || [];

        if (workspaces.length === 0) {
          router.push("/w/create" as Route);
        } else {
          const firstWorkspace = workspaces[0];
          router.push(`/w/${firstWorkspace.slug}/generate_content` as Route);
        }
      } catch (error) {
        log.error("[Auth] Failed to fetch workspaces:", error);
        const redirect = searchParams.get("redirect") || "/";
        router.push(redirect as Route);
      }
    }
    return true;
  };

  const onSubmit = async (values: LoginData) => {
    setIsLoading(true);

    // Clear any previous session invalidity flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("session_invalid");
    }

    let signedIn = false;
    try {
      signedIn = await attemptSignIn(values);
    } catch (error) {
      log.error("[AuthJS] Sign in failed:", error);
      const classifiedError = classifyError(error);
      toast.error(
        classifiedError.type === "network_error" ||
          classifiedError.type === "server_error"
          ? classifiedError.message
          : "An error occurred. Please try again.",
      );
    } finally {
      // Signed in: the next page takes over; re-enabling the button meanwhile would invite a second login.
      if (!signedIn) setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {ConfirmationComponent}
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
            You can still log in, but you won't be automatically added to the
            workspace.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {/* layout-ok: sign-in is outside the shell; its column carries the page's title */}
        <h1 className="font-display text-page-title text-foreground">
          {hasValidInvitation
            ? "Log in to join the workspace"
            : "Log in to your account"}
        </h1>
        <p className="text-body text-muted-foreground">
          {hasValidInvitation
            ? "Log in to accept your workspace invitation"
            : "Enter your email below to log in to your account"}
        </p>
      </div>

      <OAuthButtons callbackUrl={searchParams.get("redirect") || "/"} />

      {/* A submit before the page runs is the browser's own: post keeps the fields out of the address. */}
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <FieldController
            control={form.control}
            name="email"
            label="Email"
            required
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            )}
          </FieldController>
          <div className="space-y-2">
            <FieldController
              control={form.control}
              name="password"
              label="Password"
              required
            >
              {(field) => (
                <PasswordInput {...field} autoComplete="current-password" />
              )}
            </FieldController>
            <Link
              href="/forgot-password"
              className="inline-block text-body text-primary underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor="remember">Remember me for 30 days</Label>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!hydrated || isLoading || isLoadingInvitation}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {hasValidInvitation ? "Log in and join the workspace" : "Log in"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-body text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={
            invitationToken
              ? `/signup?token=${invitationToken}`
              : ("/signup" as Route)
          }
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
