"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShowAfter } from "@/hooks/use-show-after";
import type { RunStage } from "@/lib/generate-content/run-stages";
import type { WorkspaceFindings } from "@/lib/workspace/workspace-run-stages";

/** Someone named on the site, as the brand-voice step saved them. */
export interface NamedPerson {
  name: string;
  title?: string;
}

/**
 * The workspace as the analysis makes it (the founder's feedback v3, rext-control#845): its three
 * parts in the order they arrive, each first in the shape it will have and then as the part itself
 * the moment its step ends. Everything shown is what the run reported: the drafted brand voice, the
 * people named on the site, the competitors' sites. The wait ends on something to read.
 */
export function WorkspaceTakingShape({
  stages,
  findings,
  people,
}: {
  stages: RunStage[];
  findings: WorkspaceFindings;
  /**
   * The people named on the site, once the run has saved some; undefined until then. Never an
   * empty list: while the run goes on, "none yet" is not "no one".
   */
  people?: NamedPerson[];
}) {
  const ended = (id: string) => {
    const state = stages.find((stage) => stage.id === id)?.state;
    return state === "complete" || state === "failed" || state === "skipped";
  };
  const voiceEnded = ended("workspace-brand-voice");
  const competitorsEnded = ended("workspace-competitors");
  // A shape waits a moment before it shows, as every skeleton does: a part that is there at once
  // (a reconnect to a finished run) shows none.
  const showShapes = useShowAfter(true);
  const { voice, competitors } = findings;

  return (
    <div className="flex flex-col gap-8">
      <Part title="Brand voice" ready={voiceEnded}>
        {voice ? (
          <div className="flex flex-col gap-3">
            {voice.brandName && (
              <p className="text-body font-medium text-foreground">
                {voice.brandName}
              </p>
            )}
            {voice.about && (
              <p className="text-body text-foreground">{voice.about}</p>
            )}
            {voice.sellingPosition && (
              <p className="text-table text-muted-foreground">
                {voice.sellingPosition}
              </p>
            )}
            {voice.tone.length > 0 && (
              <ul aria-label="Tone" className="flex flex-wrap gap-2">
                {voice.tone.map((word) => (
                  <li key={word}>
                    <Badge variant="neutral">{word}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : voiceEnded ? (
          <Nothing>
            No brand voice could be drafted from the site. You can write it in
            the next step.
          </Nothing>
        ) : (
          showShapes && (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          )
        )}
      </Part>

      <Part
        title="Author personas"
        ready={people !== undefined && people.length > 0}
      >
        {people !== undefined && people.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {people.map((person, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: two people on a site may share a name
                key={`${index}-${person.name}`}
                className="flex flex-col gap-0.5 px-3 py-2.5"
              >
                <span className="text-body font-medium text-foreground">
                  {person.name}
                </span>
                {person.title && (
                  <span className="text-table text-muted-foreground">
                    {person.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          showShapes && (
            <div
              className="divide-y divide-border rounded-md border border-border bg-card"
              aria-hidden="true"
            >
              {[0, 1].map((row) => (
                <div key={row} className="flex flex-col gap-2 px-3 py-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              ))}
            </div>
          )
        )}
      </Part>

      <Part title="Competitors" ready={competitorsEnded}>
        {competitors && competitors.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {competitors.map((site) => (
              <li key={site}>
                <Badge variant="neutral">{site}</Badge>
              </li>
            ))}
          </ul>
        ) : competitorsEnded ? (
          <Nothing>None found. You can add them in the next step.</Nothing>
        ) : (
          showShapes && (
            <div className="flex flex-wrap gap-2" aria-hidden="true">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          )
        )}
      </Part>
    </div>
  );
}

/** One part of the workspace: its name, then what it holds, or its shape while it is made. */
function Part({
  title,
  ready,
  children,
}: {
  title: string;
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      aria-busy={!ready}
      className="flex flex-col gap-3"
    >
      <h2 className="text-section text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Nothing({ children }: { children: ReactNode }) {
  return <p className="text-table text-muted-foreground">{children}</p>;
}
