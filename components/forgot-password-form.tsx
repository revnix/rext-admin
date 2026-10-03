"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  classifyError,
  extractApiError,
  safeParseErrorBody,
} from "@/lib/error-utils";
import { ApiError } from "@/lib/api-client/core";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  type ForgotPasswordData,
  forgotPasswordSchema,
} from "@/schemas/auth-schemas";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Direct API call - no auth session needed for forgot password
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        },
      );

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        throw new ApiError(
          response.status,
          extractApiError(errorData, "Failed to send reset email"),
        );
      }

      setSuccess(true);
    } catch (err) {
      const classifiedError = classifyError(err);
      setError(
        classifiedError.type === "network_error" ||
          classifiedError.type === "server_error"
          ? classifiedError.message
          : err instanceof Error
            ? err.message
            : "Failed to send reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-transparent">
        <div className="flex flex-col space-y-1.5 px-0 mb-6">
          <h1 className="text-fluid-2xl font-semibold tracking-tight-title">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>
        <div className="px-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                Password reset email sent! Check your inbox for the reset link.
              </div>
            )}
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email" className="ml-1">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  disabled={isLoading || success}
                  error={errors.email?.message}
                  className="!shadow-none"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 !shadow-none"
                  disabled={isLoading || success}
                >
                  {isLoading
                    ? "Sending..."
                    : success
                      ? "Email Sent!"
                      : "Send Reset Link"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Remember your password?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 font-medium text-primary hover:text-primary/80"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
