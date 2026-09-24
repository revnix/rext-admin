"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  type ResetPasswordData,
  resetPasswordSchema,
} from "@/schemas/auth-schemas";
import { checkPasswordBreach } from "@/lib/password-utils";
import {
  classifyError,
  extractApiError,
  safeParseErrorBody,
} from "@/lib/error-utils";
import { ApiError } from "@/lib/api-client/core";
import type { Route } from "next";

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    setError: setFieldError,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  useEffect(() => {
    if (!confirmPasswordValue) {
      clearErrors("confirmPassword");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      setFieldError("confirmPassword", {
        type: "manual",
        message: "Passwords don't match",
      });
      return;
    }

    clearErrors("confirmPassword");
  }, [clearErrors, confirmPasswordValue, passwordValue, setFieldError]);

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

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      setError("Reset token is missing");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Check for breached password
      const breachResult = await checkPasswordBreach(data.password);
      if (breachResult.breached) {
        setError(
          `This password has appeared in ${breachResult.count.toLocaleString()} data breaches. Please choose a different password.`,
        );
        setIsLoading(false);
        return;
      }

      // Direct API call - no auth session needed for password reset
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: data.password }),
        },
      );

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        throw new ApiError(
          response.status,
          extractApiError(errorData, "Password reset failed"),
        );
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login" as Route);
      }, 3000);
    } catch (err) {
      const classifiedError = classifyError(err);
      setError(
        classifiedError.type === "network_error" ||
          classifiedError.type === "server_error"
          ? classifiedError.message
          : err instanceof Error
            ? err.message
            : "Password reset failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                The password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/forgot-password" className="block">
                <Button className="w-full">Request New Reset Link</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
                  Password reset successfully! Redirecting to login...
                </div>
              )}
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pr-10"
                      {...register("password")}
                      disabled={isLoading || success}
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
                  {errors.password && (
                    <p className="text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="pr-10"
                      {...register("confirmPassword")}
                      disabled={isLoading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || success}
                  >
                    {isLoading
                      ? "Resetting Password..."
                      : success
                        ? "Password Reset!"
                        : "Reset Password"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Remember your password?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
