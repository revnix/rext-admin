"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import { extractApiError, safeParseErrorBody } from "@/lib/error-utils";
import type { Route } from "next";

type RecoveryState =
  | { status: "verifying" }
  | { status: "restored" }
  | { status: "alreadyActive" }
  | { status: "failed"; message: string };

// The backend answers with plain sentences; these two mean "nothing is wrong,
// the account is usable" and should not be shown as errors.
const ALREADY_ACTIVE_HINTS = [
  "already been used",
  "already active",
  "does not require recovery",
];

function AccountRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<RecoveryState>({ status: "verifying" });
  const [email, setEmail] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  // The recovery token is single-use, so it must be spent exactly once even
  // though React runs effects twice in development.
  const hasVerified = useRef(false);

  const verify = useCallback(async (recoveryToken: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/account-recovery/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: recoveryToken }),
        },
      );

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const message = extractApiError(
          errorData,
          "This recovery link is invalid or has expired.",
        );
        const lower = message.toLowerCase();
        if (ALREADY_ACTIVE_HINTS.some((hint) => lower.includes(hint))) {
          setState({ status: "alreadyActive" });
          return;
        }
        setState({ status: "failed", message });
        return;
      }

      setState({ status: "restored" });
    } catch {
      setState({
        status: "failed",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  }, []);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;
    void verify(token);
  }, [token, verify]);

  const requestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequesting(true);
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
      setRequestSent(true);
      setIsRequesting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );

  const requestForm = (
    <form onSubmit={requestNewLink} className="grid gap-3">
      {requestSent ? (
        <p className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          If that account can still be recovered, a new link is on its way. The
          link is valid for 30 minutes.
        </p>
      ) : (
        <>
          <Label htmlFor="email">Send me a new recovery link</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isRequesting}
          />
          <Button type="submit" className="w-full" disabled={isRequesting}>
            {isRequesting ? "Sending..." : "Email me a new link"}
          </Button>
        </>
      )}
    </form>
  );

  if (!token) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle>Invalid recovery link</CardTitle>
          <CardDescription>
            This link is missing its recovery token. Request a new one below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {requestForm}
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

  if (state.status === "verifying") {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Restoring your account
          </CardTitle>
          <CardDescription>This only takes a moment.</CardDescription>
        </CardHeader>
      </Card>,
    );
  }

  if (state.status === "restored" || state.status === "alreadyActive") {
    const restored = state.status === "restored";
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {restored ? "Account restored" : "Your account is active"}
          </CardTitle>
          <CardDescription>
            {restored
              ? "Your account is active again and nothing was lost. Sign in to pick up where you left off."
              : "This link was already used, so there's nothing left to restore. Just sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push("/login" as Route)}
          >
            Go to login
          </Button>
        </CardContent>
      </Card>,
    );
  }

  return shell(
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          Couldn't restore your account
        </CardTitle>
        <CardDescription>{state.message}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {requestForm}
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
