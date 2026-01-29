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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
  });

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

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-bold">
            {hasValidInvitation ? "Join Workspace" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {hasValidInvitation
              ? "Complete your profile to join the workspace"
              : "Enter your details below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                {hasValidInvitation
                  ? `Account created! Joining ${invitation?.workspace.title}...`
                  : "Account created successfully! Redirecting to dashboard..."}
              </div>
            )}
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="full_name" className="ml-1">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John"
                  {...register("full_name")}
                  disabled={isLoading || success}
                  error={errors.full_name?.message}
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="email" className="ml-1">
                  Email
                  {hasValidInvitation && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (from invitation)
                    </span>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  disabled={isLoading || success}
                  readOnly={hasValidInvitation}
                  className={cn(
                    hasValidInvitation &&
                      "bg-muted cursor-not-allowed opacity-75",
                  )}
                  error={errors.email?.message}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password" className="ml-1">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  {...register("password")}
                  disabled={isLoading || success}
                  error={errors.password?.message}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword" className="ml-1">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  disabled={isLoading || success}
                  error={errors.confirmPassword?.message}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 shadow-colored-lg"
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
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 font-medium text-primary hover:text-primary/80"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
