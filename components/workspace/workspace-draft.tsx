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
 * The workspace's draft while the analysis makes it (the founder's feedback v3, rext-control#845):
 * the sections the review will hold, under the same names and in the same order, each first in the
 * shape it will have and then with what the run found the moment its step ends. So when the run
 * ends, nothing is swapped: the same sections stay where they are and become fields to edit.
 * Everything shown is what the run reported: the drafted brand voice, the competitors' sites, the
 * people named on the site.
 */
export function WorkspaceDraft({
  stages,
  findings,
  people,
  peopleFinal,
}: {
  stages: RunStage[];
  findings: WorkspaceFindings;
  /** The author personas, once read after the brand-voice step; undefined before. */
  people?: NamedPerson[];
  /** The run has ended: an empty list of people is then the last word, and said. */
  peopleFinal: boolean;
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
  // The personas are saved during the run and can arrive after the first read of them: until the
  // run has ended, none read yet means "still looking", never "no one".
  const peopleKnown =
    people !== undefined && (people.length > 0 || peopleFinal);
  const noVoice = (
    <Nothing>
      Nothing could be drafted from the site. You can write it in the review.
    </Nothing>
  );

  return (
    <div className="flex flex-col gap-8">
      <Part title="The brand" ready={voiceEnded}>
        {voice ? (
          <dl className="flex flex-col gap-4">
            <Line label="Brand name">{voice.brandName}</Line>
            <Line label="About">{voice.about}</Line>
            <Line label="What sets it apart">{voice.sellingPosition}</Line>
          </dl>
        ) : voiceEnded ? (
          noVoice
        ) : (
          showShapes && (
            <Shape>
              <Skeleton className="h-5 w-32" />
              <Lines widths={["w-full", "w-11/12", "w-3/5"]} />
              <Lines widths={["w-full", "w-2/3"]} />
            </Shape>
          )
        )}
      </Part>

      <Part title="Who it's for" ready={voiceEnded}>
        {voice ? (
          <dl className="flex flex-col gap-4">
            <Line label="Customers">{voice.customers}</Line>
            <Line label="Audiences">
              {voice.audience.length > 0 && (
                <Words label="Audiences" words={voice.audience} />
              )}
            </Line>
          </dl>
        ) : voiceEnded ? (
          noVoice
        ) : (
          showShapes && (
            <Shape>
              <Lines widths={["w-full", "w-4/5"]} />
              <Pills widths={["w-28", "w-36", "w-24"]} />
            </Shape>
          )
        )}
      </Part>

      <Part title="How it sounds" ready={voiceEnded}>
        {voice ? (
          <dl className="flex flex-col gap-4">
            <Line label="Voice">
              {voice.tone.length > 0 && (
                <Words label="Voice" words={voice.tone} />
              )}
            </Line>
            <Line label="Content pillars">
              {voice.pillars.length > 0 && (
                <Words label="Content pillars" words={voice.pillars} />
              )}
            </Line>
          </dl>
        ) : voiceEnded ? (
          noVoice
        ) : (
          showShapes && (
            <Shape>
              <Pills widths={["w-20", "w-24", "w-16"]} />
              <Pills widths={["w-32", "w-28", "w-36", "w-24"]} />
            </Shape>
          )
        )}
      </Part>

      <Part title="Competitors" ready={competitorsEnded}>
        {competitors && competitors.length > 0 ? (
          <Words label="Competitors" words={competitors} />
        ) : competitorsEnded ? (
          <Nothing>None found. You can add them in the review.</Nothing>
        ) : (
          showShapes && (
            <Shape>
              <Pills widths={["w-28", "w-24", "w-32", "w-20", "w-28"]} />
            </Shape>
          )
        )}
      </Part>

      <Part title="Author personas" ready={peopleKnown}>
        {peopleKnown && people ? (
          <AuthorPersonas people={people} />
        ) : (
          <>
            <span className="sr-only">
              Looking for the people named on your site.
            </span>
            {showShapes && (
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
            )}
          </>
        )}
      </Part>
    </div>
  );
}

/**
 * The people named on the site, as the brand-voice step saved them as author personas; the same
 * list in the draft and, under the fields, in the review.
 */
export function AuthorPersonas({ people }: { people: NamedPerson[] }) {
  if (people.length === 0) {
    return (
      <Nothing>
        No one is named on your site. You can add personas later.
      </Nothing>
    );
  }
  return (
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
  );
}

/** One section of the draft: its name, then what it holds, or its shape while it is made. */
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

/** One thing the section holds, under the name its field has in the review. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label text-foreground">{label}</dt>
      <dd className="wrap-anywhere text-body text-foreground">
        {children || (
          <span className="text-muted-foreground">Not found on the site.</span>
        )}
      </dd>
    </div>
  );
}

function Words({ label, words }: { label: string; words: string[] }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {words.map((word) => (
        <li key={word}>
          <Badge variant="neutral">{word}</Badge>
        </li>
      ))}
    </ul>
  );
}

function Nothing({ children }: { children: ReactNode }) {
  return <p className="text-table text-muted-foreground">{children}</p>;
}

function Shape({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {children}
    </div>
  );
}

function Lines({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {widths.map((width) => (
        <Skeleton key={width} className={`h-4 ${width}`} />
      ))}
    </div>
  );
}

function Pills({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {widths.map((width, index) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: bars that never change or reorder, of repeating widths
          key={index}
          className={`h-6 rounded-full ${width}`}
        />
      ))}
    </div>
  );
}
