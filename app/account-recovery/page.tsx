"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
import type { Route } from "next";

/**
 * Recovery is admin-reviewed: a deactivated or deleted user files a request
 * here, an administrator approves or rejects it in the admin "Account Recovery"
 * tab, and the user is emailed the outcome. There is no self-service restore.
 */

/** Best-effort read of the `email` claim from a legacy recovery-link JWT. */
function emailFromToken(token: string | null): string {
  if (!token) return "";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json.email === "string" ? json.email : "";
  } catch {
    return "";
  }
}

function AccountRecoveryContent() {
  const searchParams = useSearchParams();
  const prefill =
    searchParams.get("email") || emailFromToken(searchParams.get("token"));

  const [email, setEmail] = useState(prefill);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The endpoint always reports success so it can't be used to discover
      // which addresses have accounts.
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/account-recovery/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
    } finally {
      setSubmitted(true);
      setIsSubmitting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );

  if (submitted) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-600" />
            Request received
          </CardTitle>
          <CardDescription>
            If that account can still be recovered, our team will review your
            request and email you the decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={"/login" as Route}>Back to login</Link>
          </Button>
        </CardContent>
      </Card>,
    );
  }

  return shell(
    <Card>
      <CardHeader>
        <CardTitle>Recover your account</CardTitle>
        <CardDescription>
          Enter the email for the account you want back. An administrator
          reviews every request and will email you the decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={submitRequest} className="grid gap-3">
          <Label htmlFor="email">Account email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit recovery request"}
          </Button>
        </form>
        <Link
          href={"/login" as Route}
          className="text-center text-sm underline underline-offset-4"
        >
          Back to login
        </Link>
      </CardContent>
    </Card>,
  );
}

export default function AccountRecoveryPage() {
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
      <AccountRecoveryContent />
    </Suspense>
  );
}
