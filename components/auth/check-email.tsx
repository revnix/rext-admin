"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";

/**
 * What a new account sees after signing up (rext-control#461): login needs a verified email, so
 * the page says where the verification link went, to open it and then log in, and offers to send
 * it again. "Log in" carries the address to the login form.
 */
export function CheckEmail({ email }: { email: string }) {
  const resend = useMutation({
    mutationFn: () => apiClient.profile.resendVerification(email),
    onError: (error) => {
      log.error("[Signup] Couldn't resend the verification email", error);
    },
  });

  return (
    <div data-slot="check-email" className="flex flex-col gap-6">
      <div className="space-y-1">
        {/* layout-ok: sign-up is outside the shell; its column carries the page's title */}
        <h1 className="font-display text-page-title text-foreground">
          Check your email
        </h1>
        <p className="text-body text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Open it
          to verify your address, then log in.
        </p>
      </div>

      <Button data-rec="show" asChild className="w-full">
        <Link href={`/login?email=${encodeURIComponent(email)}` as Route}>
          Log in
        </Link>
      </Button>

      <div className="space-y-2 text-center text-body text-muted-foreground">
        <p>
          No email after a few minutes? Check your spam folder, or{" "}
          <Button
            data-rec="show"
            type="button"
            variant="link"
            className="h-auto p-0 font-medium"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
          >
            {resend.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            resend the email
          </Button>
          .
        </p>
        <p role="status" aria-live="polite">
          {resend.isSuccess &&
            `Sent again to ${email}. It can take a minute to arrive.`}
          {resend.isError &&
            "The email couldn't be sent again just now. Wait a minute and try again."}
        </p>
      </div>
    </div>
  );
}
