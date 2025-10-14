"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
import { log } from "@/lib/logger";

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleResend = async () => {
    if (!resendEmail) {
      setError("Please enter your email address");
      return;
    }

    setIsResending(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resendEmail }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resend verification");
      }

      setResendSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend verification",
      );
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("Verification token is missing");
        setIsVerifying(false);
        return;
      }

      try {
        log.info("[Auth Migration] Using direct API call for verify-email");

        // Direct API call - no auth session needed for email verification
        // Backend expects GET with query parameter
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Email verification failed");
        }

        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Email verification failed",
        );
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {isVerifying
                ? "Verifying your email address..."
                : success
                  ? "Email verified successfully!"
                  : "Verification failed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying && (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              </div>
            )}

            {success && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                  <p className="font-medium">Email verified successfully!</p>
                  <p className="text-sm mt-1">
                    Your account is now active. Redirecting to login...
                  </p>
                </div>
                <Link href="/login" className="block">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </div>
            )}

            {error && !isVerifying && !resendSuccess && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                  <p className="font-medium">Verification Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">
                    Request New Verification Link
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="resend-email">Email Address</Label>
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        disabled={isResending}
                      />
                    </div>
                    <Button
                      onClick={handleResend}
                      className="w-full"
                      disabled={isResending}
                    >
                      {isResending ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  </div>
                </div>

                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            )}

            {resendSuccess && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                  <p className="font-medium">Verification Email Sent!</p>
                  <p className="text-sm mt-1">
                    We've sent a new verification link to your email. Please
                    check your inbox.
                  </p>
                </div>
                <Link href="/login" className="block">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Verifying Email...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
