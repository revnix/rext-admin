"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { InvitationBanner } from "@/components/auth/invitation-banner";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { cn } from "@/lib/utils";
import { type SignupFormData, signupFormSchema } from "@/schemas/auth-schemas";
import { apiClient } from "@/lib/api-client";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Invitation validation hook
  const {
    invitationToken,
    invitation,
    isLoading: isLoadingInvitation,
    isValid: hasValidInvitation,
    error: invitationError,
  } = useInvitationValidation();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
  });

  const { handleSubmit, setValue } = form;

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation?.email) {
      setValue("email", invitation.email);
    }
  }, [invitation, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Determine which endpoint to use
      const isInvitationSignup = hasValidInvitation && invitationToken;
      const endpoint = isInvitationSignup
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/register-with-invitation`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/register`;

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

      // Register user with backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Backend returns { error: { message: "...", code: "..." } }
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          errorData.detail ||
          "Registration failed";
        throw new Error(errorMessage);
      }

      const _responseData = await response.json();
      setSuccess(true);

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
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
        } catch (fetchError) {
          log.error(
            "[Signup] Failed to fetch workspaces after login:",
            fetchError,
          );
          // Fallback to dashboard on error
          router.push("/");
        }

        // Clean up session storage
        sessionStorage.removeItem("pending_invitation_token");
      } else {
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
            You can still create an account, but you won't be automatically
            added to the workspace.
          </p>
        </div>
      )}

      <div className="bg-transparent">
        <div className="flex flex-col space-y-1.5 px-0 mb-6">
          <h1 className="text-fluid-2xl font-semibold tracking-tight-title">
            {hasValidInvitation ? "Join Workspace" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasValidInvitation
              ? "Complete your profile to join the workspace"
              : "Enter your details below to create your account"}
          </p>
        </div>
        <div className="px-0">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                  {hasValidInvitation
                    ? `Account created! Joining ${invitation?.workspace.title}...`
                    : "Account created successfully! Redirecting to dashboard..."}
                </div>
              )}

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="!text-foreground">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        type="text"
                        disabled={isLoading || success}
                        className="!shadow-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="!text-foreground">
                      Email
                      {hasValidInvitation && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (from invitation)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        type="email"
                        disabled={isLoading || success}
                        readOnly={hasValidInvitation}
                        className={cn(
                          hasValidInvitation &&
                            "bg-muted cursor-not-allowed opacity-75",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="!text-foreground">Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Create a strong password"
                        type="password"
                        disabled={isLoading || success}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="!text-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your password"
                        type="password"
                        disabled={isLoading || success}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 !shadow-none"
                disabled={isLoading || success || isLoadingInvitation}
              >
                {isLoading
                  ? hasValidInvitation
                    ? "Creating Account & Joining Workspace..."
                    : "Creating Account..."
                  : success
                    ? "Account Created!"
                    : hasValidInvitation
                      ? "Create Account & Join Workspace"
                      : "Create Account"}
              </Button>
              <div className="!mt-0 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="underline underline-offset-4 font-medium text-primary hover:text-primary/80"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
