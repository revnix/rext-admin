"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListPage } from "@/components/layouts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
  useDataTableUrlState,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useDeletePersona, usePersonas } from "@/hooks/use-personas";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { personaListParams } from "@/lib/search-params/personas";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Persona } from "@/types/workspace";

type PersonaRow = Persona & { id: string };

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function PersonaCell({ persona }: { persona: PersonaRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        <AvatarImage
          src={persona.avatar_url || ""}
          alt=""
          className="object-cover"
        />
        <AvatarFallback className="rounded-md">
          {initials(persona.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{persona.name}</p>
        {persona.full_name && persona.full_name !== persona.name && (
          <p className="truncate text-muted-foreground">{persona.full_name}</p>
        )}
      </div>
    </div>
  );
}

const column = createDataTableColumnHelper<PersonaRow>();
const columns = column.columns([
  // The search reads the name, the full name and the title; the cell shows the first two.
  column.accessor(
    (row) =>
      [row.name, row.full_name, row.professional_title]
        .filter(Boolean)
        .join(" "),
    {
      id: "name",
      header: "Persona",
      cell: ({ row }) => <PersonaCell persona={row.original} />,
      sortFn: "text",
      enableHiding: false,
    },
  ),
  column.accessor((row) => row.professional_title ?? "", {
    id: "title",
    header: "Title",
    cell: ({ getValue }) => getValue() || UNKNOWN,
    sortFn: "text",
    enableGlobalFilter: false,
  }),
  column.accessor((row) => row.article_count ?? -1, {
    id: "articles",
    header: "Articles",
    meta: { align: "end", numeric: true },
    // The backend counts them from rext-backend#818; until then the column says it doesn't know.
    cell: ({ getValue }) => (getValue() >= 0 ? getValue() : UNKNOWN),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
  column.accessor((row) => Date.parse(row.updated_at ?? "") || 0, {
    id: "updated",
    header: "Updated",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.updated_at) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

const NO_PERSONAS: PersonaRow[] = [];

/**
 * Personas (plans/app/D-pages.md §2.2): the workspace's author personas in the DataTable, the search,
 * sort and page in the URL. A row opens the persona; its menu edits or deletes it.
 */
export default function PersonasPage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const router = useRouter();
  const tableState = useDataTableUrlState(personaListParams);
  const { data, isLoading, error } = usePersonas(workspace?.id || null);
  const deletePersona = useDeletePersona(workspace?.id || "");
  // The row menu calls onSelect at once; a persona is deleted for good, so it asks first.
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { hasPermission: canRead, isLoading: isPermissionLoading } =
    useWorkspacePermission(PERSONA_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canCreate } = useWorkspacePermission(
    PERSONA_PERMISSIONS.CREATE,
    workspaceId,
  );
  const { hasPermission: canEdit } = useWorkspacePermission(
    PERSONA_PERMISSIONS.UPDATE,
    workspaceId,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    PERSONA_PERMISSIONS.DELETE,
    workspaceId,
  );

  const personas = (data?.personas.filter((p) => p.id) ??
    NO_PERSONAS) as PersonaRow[];
  const createHref = workspaceRoutes.persona_create(workspaceSlug) as Route;

  const rowActions = (row: PersonaRow): DataTableRowAction[] => [
    {
      label: "Open",
      icon: Eye,
      href: workspaceRoutes.persona(workspaceSlug, row.id),
    },
    ...(canEdit
      ? [
          {
            label: "Edit",
            icon: Pencil,
            href: workspaceRoutes.persona_edit(workspaceSlug, row.id),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: "Delete persona",
            icon: Trash2,
            destructive: true,
            onSelect: async () => {
              const confirmed = await confirm({
                title: `Delete ${row.name}?`,
                description: `It's deleted for good: a persona can't be restored. Articles written as ${row.name} keep their text and lose their author persona.`,
                confirmText: "Delete persona",
                cancelText: "Keep persona",
                variant: "destructive",
              });
              if (confirmed) deletePersona.mutate(row.id);
            },
          },
        ]
      : []),
  ];

  const newPersona = canCreate ? (
    <Button asChild>
      <Link href={createHref}>
        <Plus aria-hidden />
        New persona
      </Link>
    </Button>
  ) : null;

  if (!workspace?.id || isPermissionLoading) {
    return (
      <ListPage title="Personas">
        <Skeleton className="h-64 w-full" />
      </ListPage>
    );
  }

  return (
    <ListPage
      title="Personas"
      description="The authors your articles are written as: their experience, their voice, who they write for."
      actions={newPersona}
    >
      {ConfirmationComponent}
      {canRead ? (
        <DataTable
          caption="Personas"
          columns={columns}
          data={personas}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          state={tableState}
          isLoading={isLoading}
          error={
            error ? (
              <Notice tone="danger" title="Personas didn't load">
                Refresh the page to try again.
              </Notice>
            ) : undefined
          }
          emptyState={
            <EmptyState
              title="No personas yet"
              description="A persona gives your articles an author with real experience and a voice of their own."
              action={
                canCreate
                  ? { label: "New persona", href: createHref }
                  : undefined
              }
            />
          }
          search={{ placeholder: "Search by name or title" }}
          rowActions={rowActions}
          onRowClick={(row) =>
            router.push(workspaceRoutes.persona(workspaceSlug, row.id) as Route)
          }
          pageSizeOptions={[25, 50]}
          renderCard={(row, { actions }) => (
            <div className="flex items-start gap-3">
              {/* A card is the row on a phone: tapping it opens the persona, as a row's click does. */}
              <Link
                href={workspaceRoutes.persona(workspaceSlug, row.id) as Route}
                className="flex min-w-0 flex-1 flex-col gap-1"
              >
                <PersonaCell persona={row} />
                <p className="text-muted-foreground">
                  {[
                    row.professional_title,
                    row.article_count !== undefined
                      ? `${row.article_count} article${row.article_count === 1 ? "" : "s"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
              {actions}
            </div>
          )}
        />
      ) : (
        <Notice title="Personas are hidden from your role">
          Ask the workspace's owner if you need to see them.
        </Notice>
      )}
    </ListPage>
  );
}
