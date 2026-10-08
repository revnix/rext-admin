"use client";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type ReactNode, useId, useState } from "react";

import { usePersonas } from "@/hooks/use-personas";
import { workspaceRoutes } from "@/lib/routes";

const NAMES_SHOWN = 5;

/** "Ana Ruiz, Ben Ode and 3 more": the people a workspace's personas were drafted from, or its competitors. */
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
 * Arriving from a new workspace's analysis (WorkspaceCreateWizard): what was read from the website,
 * saved already, as three rows that each open their part: the brand voice and the competitors are
 * the fields below, the personas their own page. The personas are drafted from the people named on
 * the customer's own site, so their row says so and names them (E26): they're real people, and the
 * user decides whether they stay.
 *
 * A plain card, not a tinted success box (the founder's feedback v3, rext-control#846): the facts
 * carry it. It is still announced as a status.
 */
export function DraftedNotice({
  workspaceId,
  workspaceSlug,
  website,
  competitors,
  closing = "Review each part and save any change.",
}: {
  workspaceId: string;
  workspaceSlug: string;
  website?: string;
  /** The competitors found, as saved; unknown while the brand voice loads. */
  competitors?: string[];
  /** What to do next where it's shown. */
  closing?: string;
}) {
  // A workspace made from a description has no website (rext-control#853): the voice came from
  // what the person wrote, and nobody and no competitor was looked for.
  const withoutSite = !website?.trim();
  const titleId = useId();
  const { data, isSuccess } = usePersonas(workspaceId);
  // The personas as they were on arrival, the ones drafted from the site: a later change to the
  // list (another tab, a refetch) doesn't change who the row says came from the site.
  const [names, setNames] = useState<string[] | null>(null);
  if (isSuccess && names === null) {
    setNames(
      (data?.personas ?? [])
        .map((persona) => persona.full_name || persona.name)
        .filter(Boolean),
    );
  }

  return (
    <section
      role="status"
      aria-labelledby={titleId}
      className="rounded-md border border-border bg-card"
    >
      <div className="flex flex-col gap-1 px-4 py-3">
        <h2 id={titleId} className="text-section text-foreground">
          {withoutSite
            ? "Drafted from your description"
            : `We read ${siteName(website)}`}
        </h2>
        <p className="text-table text-muted-foreground">{closing}</p>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        <DraftedRow
          label="Brand voice"
          href="#field-brand_name"
          action="Review"
        >
          What the brand does, who it's for and how it sounds.
        </DraftedRow>
        <DraftedRow
          label="Author personas"
          href={workspaceRoutes.personas(workspaceSlug) as Route}
          action="Open"
        >
          {withoutSite && !names?.length
            ? "None yet: there is no website to read the people from. Add them in Personas."
            : names === null
              ? "From the people named on your site."
              : names.length > 0
                ? `${names.length} drafted from the people named on your site: ${namedPeople(names)}.`
                : "None drafted: no one is named on your site. Add them in Personas."}
        </DraftedRow>
        <DraftedRow
          label="Competitors"
          href="#field-competitors"
          action="Review"
        >
          {withoutSite && !competitors?.length
            ? "None yet. Add them below."
            : competitors === undefined
              ? "The sites yours is compared with."
              : competitors.length > 0
                ? `${competitors.length} found: ${namedPeople(competitors)}.`
                : "None found. Add them below."}
        </DraftedRow>
      </ul>
    </section>
  );
}

/** One part that was made: its name, what it holds, and the way into it. The whole row opens it. */
function DraftedRow({
  label,
  href,
  action,
  children,
}: {
  label: string;
  href: Route | `#${string}`;
  action: string;
  children: ReactNode;
}) {
  const row = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-4">
        <span className="shrink-0 text-body font-medium text-foreground sm:w-36">
          {label}
        </span>
        <span className="min-w-0 wrap-anywhere text-table text-muted-foreground">
          {children}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-table font-medium text-foreground">
        {action}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </>
  );
  const className =
    "flex items-start gap-4 px-4 py-3 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset";
  return (
    <li>
      {href.startsWith("#") ? (
        <a href={href} className={className}>
          {row}
        </a>
      ) : (
        <Link href={href as Route} className={className}>
          {row}
        </Link>
      )}
    </li>
  );
}
