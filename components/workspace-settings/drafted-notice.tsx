"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { Notice } from "@/components/ui/notice";
import { usePersonas } from "@/hooks/use-personas";
import { workspaceRoutes } from "@/lib/routes";

const NAMES_SHOWN = 5;

/** "Ana Ruiz, Ben Ode and 3 more": the people a workspace's personas were drafted from. */
export function namedPeople(names: string[]): string {
  const shown = names.slice(0, NAMES_SHOWN);
  const more = names.length - shown.length;
  const parts = more > 0 ? [...shown, `${more} more`] : shown;
  return new Intl.ListFormat("en", { type: "conjunction" }).format(parts);
}

function siteName(website: string | undefined): string {
  try {
    return website ? new URL(website).host : "your website";
  } catch {
    return "your website";
  }
}

/**
 * Arriving from a new workspace's analysis (WorkspaceCreateWizard): the draft is saved already. The
 * personas are drafted from the people named on the customer's own site, so the notice says so and
 * names them (E26): they're real people, and the user decides whether they stay.
 */
export function DraftedNotice({
  workspaceId,
  workspaceSlug,
  website,
  closing = "Review the fields below and save any change.",
}: {
  workspaceId: string;
  workspaceSlug: string;
  website?: string;
  /** The notice's last sentence: what to do next where it's shown. */
  closing?: string;
}) {
  const { data, isSuccess } = usePersonas(workspaceId);
  // The personas as they were on arrival, the ones drafted from the site: a later change to the
  // list (another tab, a refetch) doesn't change who the notice says came from the site.
  const [names, setNames] = useState<string[] | null>(null);
  if (isSuccess && names === null) {
    setNames(
      (data?.personas ?? [])
        .map((persona) => persona.full_name || persona.name)
        .filter(Boolean),
    );
  }
  const personasLink = (
    <Link
      href={workspaceRoutes.personas(workspaceSlug) as Route}
      className="font-medium text-foreground underline underline-offset-4"
    >
      Personas
    </Link>
  );

  return (
    <Notice tone="success" title="Your brand voice is drafted">
      We read {siteName(website)} and saved this brand voice and its
      competitors.{" "}
      {names &&
        (names.length > 0 ? (
          <>
            We also drafted{" "}
            {names.length === 1
              ? "an author persona"
              : `${names.length} author personas`}{" "}
            from the people named on your site: {namedPeople(names)}. Edit or
            delete them in {personasLink}.{" "}
          </>
        ) : (
          <>
            No one is named on your site, so no author personas were drafted;
            you can add them in {personasLink}.{" "}
          </>
        ))}
      {closing}
    </Notice>
  );
}
