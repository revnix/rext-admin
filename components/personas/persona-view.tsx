"use client";

import { ExternalLink, Loader2, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useDeletePersona } from "@/hooks/use-personas";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { splitList } from "@/lib/validation/persona-validation";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Persona } from "@/types/workspace";
import { initials } from "@/lib/initials";

/** A titled card in the main column, left out when it has nothing to show. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-section">{title}</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

/** One labelled fact: a term and what the persona says. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="text-body break-words whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * A persona's page body (plans/app/D-pages.md §2.2): what it writes from in the main column (about,
 * expertise and voice, audience, goals and challenges, behaviours), each card only when it has
 * something, and the facts in the aside.
 */
export function PersonaSections({ persona }: { persona: Persona }) {
  const expertise = splitList(persona.areas_of_expertise);
  const goals = splitList(persona.goals);
  const painPoints = splitList(persona.pain_points);
  const behaviors = splitList(persona.behaviors);
  const about = persona.description?.trim() || persona.bio?.trim();
  const hasVoice = expertise.length > 0 || Boolean(persona.tone_of_voice);
  const hasGoals = goals.length > 0 || painPoints.length > 0;

  if (
    !about &&
    !hasVoice &&
    !persona.demographics &&
    !hasGoals &&
    !behaviors.length
  ) {
    return (
      <p className="text-body text-muted-foreground">
        Nothing written about this persona yet. Its bio, expertise, voice and
        audience shape every article written as it.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {about && (
        <Section title="About">
          <dl className="flex flex-col gap-4">
            {persona.description?.trim() && (
              <Fact label="In a sentence">{persona.description}</Fact>
            )}
            {persona.bio?.trim() && <Fact label="Bio">{persona.bio}</Fact>}
          </dl>
        </Section>
      )}
      {hasVoice && (
        <Section title="Expertise and voice">
          <dl className="flex flex-col gap-4">
            {expertise.length > 0 && (
              <Fact label="Areas of expertise">
                <span className="flex flex-wrap gap-1.5">
                  {expertise.map((area) => (
                    <Badge key={area} variant="neutral">
                      {area}
                    </Badge>
                  ))}
                </span>
              </Fact>
            )}
            {persona.tone_of_voice && (
              <Fact label="Tone of voice">{persona.tone_of_voice}</Fact>
            )}
          </dl>
        </Section>
      )}
      {persona.demographics && (
        <Section title="Audience">
          <p className="text-body whitespace-pre-wrap">
            {persona.demographics}
          </p>
        </Section>
      )}
      {hasGoals && (
        <Section title="Goals and challenges">
          <dl className="flex flex-col gap-4">
            {goals.length > 0 && (
              <Fact label="Goals">
                <List items={goals} />
              </Fact>
            )}
            {painPoints.length > 0 && (
              <Fact label="Pain points">
                <List items={painPoints} />
              </Fact>
            )}
          </dl>
        </Section>
      )}
      {behaviors.length > 0 && (
        <Section title="Behaviours">
          <List items={behaviors} />
        </Section>
      )}
    </div>
  );
}

/** The aside: the picture and the facts about the persona itself. */
export function PersonaFacts({
  persona,
  articleCount,
}: {
  persona: Persona;
  articleCount?: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <Avatar className="size-16 rounded-md border">
          <AvatarImage
            src={persona.avatar_url || ""}
            alt=""
            className="object-cover"
          />
          <AvatarFallback className="rounded-md text-xl font-semibold">
            {initials(persona.name)}
          </AvatarFallback>
        </Avatar>
        <dl className="flex flex-col gap-4">
          {persona.full_name?.trim() && (
            <Fact label="Full name">{persona.full_name}</Fact>
          )}
          {persona.professional_title?.trim() && (
            <Fact label="Title">{persona.professional_title}</Fact>
          )}
          {articleCount !== undefined && (
            <Fact label="Articles written">
              <span className="num">{articleCount}</span>
            </Fact>
          )}
          {persona.linkedin_url && (
            <Fact label="LinkedIn">
              <a
                href={persona.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all underline underline-offset-4"
              >
                {persona.linkedin_url.replace(/^https?:\/\/(www\.)?/, "")}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </Fact>
          )}
          {persona.updated_at && (
            <Fact label="Last changed">
              {dateFormat.short(persona.updated_at)}
            </Fact>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * The page's actions: Edit, and Delete behind a confirmation that names it. A persona is deleted for
 * good (the backend keeps no trash for them), and its articles stay, without an author persona.
 */
export function PersonaActions({ persona }: { persona: Persona }) {
  const { workspace, workspaceId, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const deletePersona = useDeletePersona(workspace?.id || "");
  const [open, setOpen] = useState(false);
  const { hasPermission: canEdit } = useWorkspacePermission(
    PERSONA_PERMISSIONS.UPDATE,
    workspaceId,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    PERSONA_PERMISSIONS.DELETE,
    workspaceId,
  );
  if (!persona.id || (!canEdit && !canDelete)) return null;
  const personaId = persona.id;

  return (
    <div className="flex flex-wrap gap-2">
      {canDelete && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {persona.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                It's deleted for good: a persona can't be restored. Articles
                written as {persona.name} keep their text and lose their author
                persona.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePersona.isPending}>
                Keep persona
              </AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                disabled={deletePersona.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  deletePersona.mutate(personaId, {
                    onSuccess: () => {
                      setOpen(false);
                      router.push(
                        workspaceRoutes.personas(workspaceSlug) as Route,
                      );
                    },
                  });
                }}
              >
                {deletePersona.isPending && (
                  <Loader2 className="animate-spin" aria-hidden />
                )}
                Delete persona
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canEdit && (
        <Button asChild>
          <Link
            href={
              workspaceRoutes.persona_edit(workspaceSlug, personaId) as Route
            }
          >
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
      )}
    </div>
  );
}
