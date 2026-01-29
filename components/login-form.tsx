"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
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
import { getAuthHeaders } from "@/lib/auth-utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState("");
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
      const message = errorMessages[urlError] || errorMessages.Default;
      setError(message);
      toast.error(message);
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Try to get specific error message from backend first
      // This allows us to show detailed errors like "Account locked" before NextAuth processes it
      const backendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!backendResponse.ok) {
        // Extract specific error message from backend (e.g., account lockout)
        const errorData = await backendResponse.json().catch(() => ({}));
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          "Invalid email or password. Please check your credentials and try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Backend validated successfully, now use NextAuth for session creation
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        rememberMe: rememberMe.toString(),
      });

      if (result?.error) {
        setError("Authentication failed. Please try again.");
        toast.error("Authentication failed. Please try again.");
        return;
      }

      // Handle redirect based on invitation presence
      if (hasValidInvitation && invitationToken) {
        // Redirect to invitation acceptance page
        router.push(`/accept-invitation?token=${invitationToken}`);
      } else {
        // Wait for session to be established (cookies to be set)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force refresh auth headers to ensure we have the new token
        await getAuthHeaders(true);

        // Fetch workspaces to determine redirect
        try {
          const response = await apiClient.workspaces.list();
          const workspaces = response.workspaces || [];

          if (workspaces.length === 0) {
            // No workspace exists, redirect to create workspace
            router.push("/w/create");
          } else {
            // Workspace exists, redirect to generate content page
            const firstWorkspace = workspaces[0];
            router.push(`/w/${firstWorkspace.slug}/generate_content`);
          }
        } catch (error) {
          log.error("[Auth] Failed to fetch workspaces:", error);
          // Fallback to dashboard on error
          const redirect = searchParams.get("redirect") || "/";
          router.push(redirect);
        }
      }
    } catch (error) {
      log.error("[AuthJS] Sign in failed:", error);
      setError("An error occurred. Please try again.");
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
          workspaceName={invitation.workspace.title}
          workspaceSlug={invitation.workspace.slug}
          inviterName={`${invitation.invited_by.first_name} ${invitation.invited_by.last_name}`}
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
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="!shadow-none"
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="!shadow-none"
                />
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
                    : "/signup"
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
