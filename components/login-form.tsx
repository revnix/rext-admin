"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

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
      setError(errorMessages[urlError] || errorMessages.Default);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      log.info("[AuthJS] Signing in user:", email, "Remember me:", rememberMe);

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
        return;
      }

      // Backend validated successfully, now use NextAuth for session creation
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        rememberMe: rememberMe.toString(),
      });

      log.info("[AuthJS] Sign in result:", result);

      if (result?.error) {
        setError("Authentication failed. Please try again.");
        return;
      }

      // Redirect to the original page or default to dashboard
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (error) {
      log.error("[AuthJS] Sign in failed:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <OAuthButtons callbackUrl={searchParams.get("redirect") || "/"} />

            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
