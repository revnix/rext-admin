"use client";

import Link from "next/link";
import { getAuthHeaders, resetAuthRedirectState } from "@/lib/auth-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InvitationBanner } from "@/components/auth/invitation-banner";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { analytics } from "@/lib/analytics";
import type { Route } from "next";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasInvalidCredentialsError, setHasInvalidCredentialsError] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Invitation validation hook
  const {
    invitationToken,
    invitation,
    isLoading: isLoadingInvitation,
    isValid: hasValidInvitation,
    error: invitationError,
  } = useInvitationValidation();

  // Handle URL error parameters (e.g., session expired)
  useEffect(() => {
    const urlError = searchParams.get("error");
    const errorCode = searchParams.get("code");

    if (urlError) {
      const errorMessages: Record<string, string> = {
        SessionExpired: "Your session has expired. Please log in again.",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasInvalidCredentialsError(false);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const hasEmail = trimmedEmail.length > 0;
    const hasPassword = trimmedPassword.length > 0;

    // Do not show credential errors for empty fields; only focus the first missing field.
    if (!hasEmail || !hasPassword) {
      if (!hasEmail) {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    // Clear any previous session invalidity flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("session_invalid");
    }

    try {
      // Backend validated successfully, now use NextAuth for session creation
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        rememberMe: rememberMe.toString(),
      });

      if (result?.error) {
        // Use the error message from the backend if available (stored in result.code)
        // Fallback to a generic message if result.code is just "CredentialsSignin" or missing
        const errorMessage =
          result.code && result.code !== "CredentialsSignin"
            ? result.code
            : "Authentication failed. Please check your credentials and try again.";

        const isInvalidCredentials = errorMessage
          .toLowerCase()
          .includes("invalid email or password");

        if (isInvalidCredentials) {
          setHasInvalidCredentialsError(true);
          emailInputRef.current?.focus();
        }

        toast.error(errorMessage);
        return;
      }

      toast.success("Login successful!");
      analytics.track("user_signed_in", { method: "credentials" });
      resetAuthRedirectState();

      if (hasValidInvitation && invitationToken) {
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
    } catch (error) {
      log.error("[AuthJS] Sign in failed:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Invitation Banner */}
      {hasValidInvitation && invitation && (
        <InvitationBanner
          workspaceName={invitation.workspace.name}
          workspaceSlug={invitation.workspace.slug}
          inviterName={
            invitation.invited_by.display_name ||
            invitation.invited_by.full_name ||
            "Workspace Admin"
          }
          roleName={invitation.role.display_name}
          inviteeEmail={invitation.email}
          isLoading={isLoadingInvitation}
        />
      )}

      {/* Show invitation error if validation failed */}
      {invitationToken && !hasValidInvitation && !isLoadingInvitation && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <p className="font-medium">Invitation Link Issue</p>
          <p className="text-sm mt-1">
            {invitationError ||
              "This invitation link is invalid or has expired."}
          </p>
          <p className="text-sm mt-2">
            You can still log in, but you won't be automatically added to the
            workspace.
          </p>
        </div>
      )}

      <div className="bg-transparent">
        <div className="flex flex-col space-y-1.5 px-0 mb-6">
          <h1 className="text-fluid-2xl font-semibold tracking-tight-title">
            {hasValidInvitation
              ? "Log in to join workspace"
              : "Login to your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasValidInvitation
              ? "Log in to accept your workspace invitation"
              : "Enter your email below to login to your account"}
          </p>
        </div>
        <div className="px-0">
          <form onSubmit={handleSubmit}>
            <OAuthButtons callbackUrl={searchParams.get("redirect") || "/"} />

            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email" className="ml-1">
                  Email
                </Label>
                <Input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (hasInvalidCredentialsError) {
                      setHasInvalidCredentialsError(false);
                    }
                  }}
                  className={cn(
                    "!shadow-none",
                    hasInvalidCredentialsError &&
                      "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="ml-1">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (hasInvalidCredentialsError) {
                        setHasInvalidCredentialsError(false);
                      }
                    }}
                    className={cn(
                      "!shadow-none pr-10",
                      hasInvalidCredentialsError &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-md text-base font-medium transition-all !shadow-none"
                  disabled={isLoading || isLoadingInvitation}
                >
                  {isLoading
                    ? hasValidInvitation
                      ? "Logging in & joining workspace..."
                      : "Logging in..."
                    : hasValidInvitation
                      ? "Login & Join Workspace"
                      : "Login"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  invitationToken
                    ? `/signup?token=${invitationToken}`
                    : ("/signup" as Route)
                }
                className="underline underline-offset-4 font-medium text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
