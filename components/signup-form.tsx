"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit, setValue } = form;
  const passwordValue = form.watch("password") || "";
  const confirmPasswordValue = form.watch("confirmPassword") || "";

  useEffect(() => {
    if (!confirmPasswordValue) {
      form.clearErrors("confirmPassword");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords don't match",
      });
      return;
    }

    form.clearErrors("confirmPassword");
  }, [confirmPasswordValue, form, passwordValue]);

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "text-red-500" };
    if (score <= 4) return { label: "Fair", color: "text-yellow-500" };
    return { label: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(passwordValue);

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

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
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
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          router.push("/login" as Route);
        }, 2000);
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
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground!">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        type="text"
                        disabled={isLoading}
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
                    <FormLabel className="text-foreground!">
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
                        disabled={isLoading}
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
                    <FormLabel className="text-foreground!">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Create a strong password"
                          type={showPassword ? "text" : "password"}
                          disabled={isLoading}
                          className="pr-10"
                          {...field}
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
                    </FormControl>
                    {passwordValue && (
                      <p className="text-sm text-muted-foreground">
                        Password strength:{" "}
                        <span className={passwordStrength.color}>
                          {passwordStrength.label}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase,
                      number, and special character.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground!">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Confirm your password"
                          type={showConfirmPassword ? "text" : "password"}
                          disabled={isLoading}
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 shadow-none!"
                disabled={isLoading || isLoadingInvitation}
              >
                {isLoading
                  ? hasValidInvitation
                    ? "Creating Account & Joining Workspace..."
                    : "Creating Account..."
                  : hasValidInvitation
                    ? "Create Account & Join Workspace"
                    : "Create Account"}
              </Button>
              <div className="mt-0! text-center text-sm">
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
