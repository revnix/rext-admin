"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/ui/data-table/data-table-row-actions";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  canRemoveRow,
  groupRows,
  listLabel,
  sectionPlan,
  type TreeRow,
} from "@/lib/generate-content/outline-review";
import { cn } from "@/lib/utils";

export interface OutlineTreeProps {
  rows: TreeRow[];
  /** The outline the rows point into, for each section's plan. */
  outline: unknown;
  /** Lists a section may be added to (the gate says which). */
  addableLists: string[];
  /** False while the outline streams or the step is busy: rows show, nothing moves. */
  editable: boolean;
  onReorder: (list: string, listRows: TreeRow[]) => void;
  onMove: (key: string, offset: -1 | 1) => void;
  onRename: (key: string, heading: string) => void;
  onRemove: (key: string) => void;
  onAdd: (list: string, heading: string) => void;
}

/**
 * The outline as a tree: one row per section, in the article's order, with the
 * section's word budget, and its plan (what it covers, the questions it
 * answers, its key points) folded under it. Rows move by dragging the handle or
 * from the row's menu (Move up, Move down), so a keyboard or a single tap can
 * reorder too (WCAG 2.2, 2.5.7); headings are renamed in place.
 */
export function OutlineTree({
  rows,
  outline,
  addableLists,
  editable,
  onReorder,
  onMove,
  onRename,
  onRemove,
  onAdd,
}: OutlineTreeProps) {
  const groups = groupRows(rows);
  const named = groups.length > 1;
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.list}
          aria-label={named ? listLabel(group.list) : "Sections"}
        >
          {named && (
            <h3 className="mb-2 text-label text-muted-foreground">
              {listLabel(group.list)}
            </h3>
          )}
          <Reorder.Group
            as="ol"
            axis="y"
            values={group.rows}
            onReorder={(next: TreeRow[]) => onReorder(group.list, next)}
            className="divide-y divide-border rounded-md border border-border bg-card"
          >
            {group.rows.map((row, index) => (
              <TreeRowItem
                key={row.key}
                row={row}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === group.rows.length - 1}
                canRemove={canRemoveRow(rows, row.key)}
                plan={sectionPlan(outline, row.id)}
                editable={editable}
                onMove={onMove}
                onRename={onRename}
                onRemove={onRemove}
              />
            ))}
          </Reorder.Group>
          {editable && addableLists.includes(group.list) && (
            <AddSection onAdd={(heading) => onAdd(group.list, heading)} />
          )}
        </section>
      ))}
    </div>
  );
}

function TreeRowItem({
  row,
  position,
  isFirst,
  isLast,
  canRemove,
  plan,
  editable,
  onMove,
  onRename,
  onRemove,
}: {
  row: TreeRow;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  plan: ReturnType<typeof sectionPlan>;
  editable: boolean;
  onMove: (key: string, offset: -1 | 1) => void;
  onRename: (key: string, heading: string) => void;
  onRemove: (key: string) => void;
}) {
  const dragControls = useDragControls();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(row.heading);
  const hasPlan =
    !!plan &&
    (!!plan.description ||
      plan.questions.length > 0 ||
      plan.keyPoints.length > 0);
  const planId = `section-plan-${row.key}`;

  const save = () => {
    if (draft.trim() && draft.trim() !== row.heading) onRename(row.key, draft);
    else setDraft(row.heading);
    setRenaming(false);
  };

  return (
    <Reorder.Item
      as="li"
      value={row}
      dragListener={false}
      dragControls={dragControls}
      className="relative bg-card first:rounded-t-md last:rounded-b-md"
    >
      <div
        className={cn(
          "flex min-h-11 items-center gap-2 py-1.5 pr-1.5",
          row.level === "H3" ? "pl-8" : "pl-1.5",
        )}
      >
        {editable ? (
          <button
            type="button"
            aria-label={`Drag to reorder ${row.heading}`}
            onPointerDown={(event) => dragControls.start(event)}
            className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-inset active:cursor-grabbing max-lg:size-10"
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="size-8 shrink-0" />
        )}
        <span className="w-6 shrink-0 text-right font-mono text-table text-muted-foreground num">
          {position}
        </span>
        {renaming ? (
          <Input
            autoFocus
            aria-label="Section heading"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              } else if (event.key === "Escape") {
                setDraft(row.heading);
                setRenaming(false);
              }
            }}
            className="h-8 min-w-0 flex-1 text-body"
          />
        ) : (
          <button
            type="button"
            disabled={!hasPlan}
            aria-expanded={hasPlan ? open : undefined}
            aria-controls={hasPlan ? planId : undefined}
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left disabled:cursor-default"
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)",
                open && "rotate-90",
                !hasPlan && "invisible",
              )}
            />
            <span className="min-w-0 flex-1 text-body font-medium text-foreground">
              {row.heading}
            </span>
          </button>
        )}
        {row.level === "H3" && (
          <span className="shrink-0 font-mono text-caption text-muted-foreground">
            H3
          </span>
        )}
        {plan?.wordCount ? (
          <span className="shrink-0 text-table text-muted-foreground num max-sm:hidden">
            ~{plan.wordCount.toLocaleString()} words
          </span>
        ) : row.id === null ? (
          <span className="shrink-0 text-table text-muted-foreground">New</span>
        ) : null}
        {editable && (
          <DataTableRowActions
            label={row.heading}
            actions={[
              {
                label: "Rename",
                icon: Pencil,
                onSelect: () => {
                  setDraft(row.heading);
                  setRenaming(true);
                },
              },
              {
                label: "Move up",
                icon: ArrowUp,
                onSelect: () => onMove(row.key, -1),
                disabled: isFirst,
              },
              {
                label: "Move down",
                icon: ArrowDown,
                onSelect: () => onMove(row.key, 1),
                disabled: isLast,
              },
              {
                label: "Remove",
                icon: Trash2,
                destructive: true,
                onSelect: () => onRemove(row.key),
                disabled: canRemove
                  ? false
                  : "An article keeps at least one section here",
              },
            ]}
          />
        )}
      </div>
      {hasPlan && open && plan && (
        <div
          id={planId}
          className={cn(
            "space-y-3 pb-3 pr-4 text-table text-muted-foreground",
            row.level === "H3" ? "pl-24" : "pl-16",
          )}
        >
          {plan.description && <p>{plan.description}</p>}
          {plan.questions.length > 0 && (
            <div>
              <p className="mb-1 text-label text-foreground">
                Questions to answer
              </p>
              <ul className="list-disc space-y-0.5 pl-4 marker:text-muted-foreground">
                {plan.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          )}
          {plan.keyPoints.length > 0 && (
            <div>
              <p className="mb-1 text-label text-foreground">Key points</p>
              <ul className="list-disc space-y-0.5 pl-4 marker:text-muted-foreground">
                {plan.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

function AddSection({ onAdd }: { onAdd: (heading: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [heading, setHeading] = useState("");
  const close = () => {
    setHeading("");
    setAdding(false);
  };
  if (!adding) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 text-muted-foreground"
        onClick={() => setAdding(true)}
      >
        <Plus />
        Add section
      </Button>
    );
  }
  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (heading.trim()) onAdd(heading);
        close();
      }}
    >
      <Input
        autoFocus
        aria-label="New section heading"
        placeholder="The new section's heading"
        value={heading}
        onChange={(event) => setHeading(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        className="h-9 min-w-0 flex-1 text-body"
      />
      <Button type="submit" size="sm" disabled={!heading.trim()}>
        Add
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={close}>
        Cancel
      </Button>
    </form>
  );
}

/** The sections as the model writes them, before the outline parses. */
export function StreamingTree({ headings }: { headings: string[] }) {
  return (
    <ol
      aria-busy="true"
      aria-label="Sections, being written"
      className="divide-y divide-border rounded-md border border-border bg-card"
    >
      {headings.map((heading, index) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: the streamed list only grows at its end, so a heading's place is its identity
          key={`${index}-${heading}`}
          className="flex min-h-11 items-center gap-2 py-1.5 pl-1.5 pr-1.5"
        >
          <span className="size-8 shrink-0" />
          <span className="w-6 shrink-0 text-right font-mono text-table text-muted-foreground num">
            {index + 1}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-4 shrink-0" />
            <span className="text-body font-medium text-foreground">
              {heading}
            </span>
          </span>
        </li>
      ))}
      <li className="flex min-h-11 items-center gap-2 py-1.5 pl-1.5 pr-1.5">
        <span className="size-8 shrink-0" />
        <span className="w-6 shrink-0" />
        <span className="flex flex-1 items-center gap-1.5">
          <span className="size-4 shrink-0" />
          <Skeleton className="h-4 w-2/3" />
        </span>
      </li>
    </ol>
  );
}
