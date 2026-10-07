"use client";

import { Mail, Plus } from "lucide-react";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { INTEGRATION_REQUEST_URL } from "@/config/integrations";
import { INTEGRATION_MARKS } from "./integration-logos";

const WordPressMark = INTEGRATION_MARKS.wordpress;

/** The platforms coming next, each a card with no action (founder's feedback v2, #707). */
const COMING_SOON = [
  {
    name: "Nextly",
    Mark: INTEGRATION_MARKS.nextly,
    text: (
      <>
        Publish articles to Nextly, our own CMS (
        <a
          href="https://nextlyhq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          nextlyhq.com
        </a>
        ).
      </>
    ),
  },
  {
    name: "Ghost",
    Mark: INTEGRATION_MARKS.ghost,
    text: "Publish articles to your Ghost site as posts.",
  },
  {
    name: "Search Console",
    Mark: INTEGRATION_MARKS.searchConsole,
    text: "See how each article does in Google Search: its clicks, impressions and queries.",
  },
] as const;

/** One platform: its mark and name, what it does, and its one action at the bottom. */
function PlatformCard({
  mark,
  name,
  badge,
  children,
  action,
}: {
  mark?: React.ReactNode;
  name: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        {mark}
        <h3 className="text-label font-semibold text-foreground">{name}</h3>
        {badge}
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
      {action && <div className="mt-auto">{action}</div>}
    </Card>
  );
}

/**
 * Where a workspace can publish (plans/app/D-pages.md §2.3, DECISIONS.md): WordPress, through the
 * plugin; Nextly, Ghost and Search Console as "Coming soon" with no action, and Shopify not shown
 * at all (founder's feedback v2, 2026-10-07, #707); every other platform as a request.
 */
export function IntegrationCatalogue({
  hasSites,
  canCreate,
  onConnectWordPress,
}: {
  hasSites: boolean;
  canCreate: boolean;
  onConnectWordPress: () => void;
}) {
  const connectLabel = hasSites ? "Connect another site" : "Connect";
  const connect = canCreate ? (
    <Button onClick={onConnectWordPress}>
      <Plus aria-hidden />
      {connectLabel}
    </Button>
  ) : (
    <LockedFeatureTooltip message="Connecting a site needs the Create integration permission: ask the workspace's owner.">
      <Button disabled>
        <Plus aria-hidden />
        {connectLabel}
      </Button>
    </LockedFeatureTooltip>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PlatformCard
        mark={<WordPressMark aria-hidden className="size-5" />}
        name="WordPress"
        action={connect}
      >
        Publish articles to your site as posts: live, as drafts or for review.
        Needs the Rext AI plugin on your site.
      </PlatformCard>
      {COMING_SOON.map(({ name, Mark, text }) => (
        <PlatformCard
          key={name}
          mark={<Mark aria-hidden className="size-5 text-muted-foreground" />}
          name={name}
          badge={<Badge variant="neutral">Coming soon</Badge>}
        >
          {text}
        </PlatformCard>
      ))}
      <PlatformCard
        name="Somewhere else?"
        action={
          <Button asChild variant="outline">
            <a href={INTEGRATION_REQUEST_URL}>
              <Mail aria-hidden />
              Request an integration
            </a>
          </Button>
        }
      >
        Webflow or another platform: tell us where you publish, and the requests
        decide what we connect next. Meanwhile, any article copies as HTML,
        Markdown or text from the editor.
      </PlatformCard>
    </div>
  );
}
