"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ApiError, apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { settingsRoutes } from "@/lib/routes";

/**
 * Where every email's unsubscribe link lands (rext-control#541). It needs no sign-in: the token in
 * the link is the proof. Nothing happens until the button is pressed, because mail scanners open
 * the links in an email before the person does.
 */
export function UnsubscribeCard({ token }: { token: string | null }) {
  const unsubscribe = useMutation({
    mutationFn: (value: string) => apiClient.notifications.unsubscribe(value),
    onError: (error) => {
      log.error("[Unsubscribe] The unsubscribe request failed", error);
    },
  });

  const unknownToken =
    unsubscribe.isError &&
    ApiError.is(unsubscribe.error) &&
    unsubscribe.error.statusCode === 404;

  if (!token || unknownToken) {
    return (
      <Section title="This link doesn't work">
        <p className="text-body text-muted-foreground">
          Open the unsubscribe link from your most recent Rext AI email, or sign
          in and turn emails off in your notification settings.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={settingsRoutes.notifications as Route}>
            Notification settings
          </Link>
        </Button>
      </Section>
    );
  }

  if (unsubscribe.isSuccess) {
    return (
      <Section title="You're unsubscribed">
        <p className="text-body text-muted-foreground" role="status">
          Rext AI won't send you emails any more. You can turn the ones you want
          back on in your notification settings.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={settingsRoutes.notifications as Route}>
            Notification settings
          </Link>
        </Button>
      </Section>
    );
  }

  return (
    <Section title="Unsubscribe from Rext AI emails">
      <p className="text-body text-muted-foreground">
        You'll stop getting Rext AI's emails. You can turn them back on any time
        in your notification settings.
      </p>
      {unsubscribe.isError && (
        <Notice tone="danger" title="That didn't work">
          We couldn't unsubscribe you just now. Try again in a moment.
        </Notice>
      )}
      <Button
        type="button"
        className="w-full"
        onClick={() => unsubscribe.mutate(token)}
        disabled={unsubscribe.isPending}
      >
        {unsubscribe.isPending && (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        )}
        Unsubscribe
      </Button>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="unsubscribe" className="flex flex-col gap-6">
      {/* layout-ok: the auth frame is outside the shell; its column carries the page's title */}
      <h1 className="font-display text-page-title text-foreground">{title}</h1>
      {children}
    </div>
  );
}
