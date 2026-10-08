"use client";

import {
  type Announcements,
  DndContext,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  CornerDownRight,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  type DataTableRowAction,
  DataTableRowActions,
} from "@/components/ui/data-table/data-table-row-actions";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  addedSections,
  blockEnd,
  canAddSection,
  canChangeLevel,
  canRemoveRow,
  dropGaps,
  type GateBlock,
  type HeadingLevel,
  insertLevelAt,
  isSectionList,
  levelRank,
  listLabel,
  listSummary,
  outlineParts,
  MAX_ADDED_SECTIONS,
  moveTarget,
  nearestGap,
  placeBelow,
  type SectionPlan,
  sectionPlan,
  siblingPlace,
  type TreeRow,
} from "@/lib/generate-content/outline-review";
import { cn } from "@/lib/utils";

export interface OutlineTreeProps {
  rows: TreeRow[];
  /** The outline the rows point into, for each section's plan and word budget. */
  outline: unknown;
  /** The article's title, the outline's root (H1): shown, not edited here (it was chosen in step 4). */
  title?: string;
  /** Lists a section may be added to (the gate says which). */
  addableLists: string[];
  /**
   * The article's parts in order, where the gate lists them (task 814): each list takes its place
   * among the parts that are only read, which `renderBlock` draws.
   */
  structure?: GateBlock[];
  renderBlock?: (block: GateBlock) => ReactNode;
  /** False while the outline streams or the step is busy: rows show, nothing moves. */
  editable: boolean;
  /** Each edit says whether it happened; the outline announces what it did. */
  onMove: (key: string, offset: -1 | 1) => boolean;
  /** A drop: the row's block into `gap` of its list's rows (0 is the top). */
  onMoveTo: (key: string, gap: number) => boolean;
  onChangeLevel: (key: string, level: "H2" | "H3") => boolean;
  onRename: (key: string, heading: string) => void;
  onRemove: (key: string) => boolean;
  onInsert: (
    list: string,
    gap: number,
    heading: string,
    level: "H2" | "H3",
  ) => boolean;
}

/** Why adding stops: the backend takes six new sections per approval and drops the rest. */
export const ADD_CAP_REASON = `One approval adds at most ${MAX_ADDED_SECTIONS} sections`;

/**
 * The outline as a document's outline (rext-control#696, option A): the title as its root (H1), one
 * row per section with a text tag for its level, subsections indented under a guide line, and each
 * section's plan (what it covers, the questions it answers, its key points) under it, open from
 * the start and folded away by its chevron.
 *
 * Each list is a tree grid and one stop in the Tab order: ↑ ↓ Home End move between sections, Enter or
 * F2 renames in place, Alt+↑ ↓ moves a section (an H2 with its subsections), Alt+→ ← makes it a
 * subsection or a section, Delete removes it, and Shift+F10, the context-menu key or the … button
 * opens its menu, which offers every action with its keys (WCAG 2.2, 2.5.7: dragging is never the only
 * way). The handle drags with the pointer only, onto a drop line between whole sections. The keys are
 * named once, under the last list, for every list on the page.
 */
export function OutlineTree({
  rows,
  outline,
  title,
  addableLists,
  structure = [],
  renderBlock,
  editable,
  ...edits
}: OutlineTreeProps) {
  const hintsId = useId();
  const parts = outlineParts(structure, rows);
  const lists = parts.filter((part) => part.kind === "list");
  // One list of sections alone is "Sections"; beside another list, or a part that is only read,
  // each is headed by its own name, and so is a list of entries (a roundup's alternatives).
  const named = parts.length > 1;
  // A How-to's Steps and Tools have no heading levels: the level keys are named only where a list has them.
  const anyLevels = lists.some((group) => group.rows.some((row) => row.level));
  const lastList = lists[lists.length - 1]?.list;
  return (
    <div className="space-y-6">
      {parts.map((part, index) =>
        part.kind === "block" ? (
          <Fragment key={`part-${part.block.key}`}>
            {renderBlock?.(part.block)}
          </Fragment>
        ) : (
          <OutlineGroup
            key={part.list}
            list={part.list}
            label={
              named || !isSectionList(part.list, rows)
                ? listLabel(part.list)
                : "Sections"
            }
            listRows={part.rows}
            rows={rows}
            outline={outline}
            // The title is the outline's root: atop the first part when that is a list.
            title={index === 0 ? title : undefined}
            editable={editable}
            addable={editable && addableLists.includes(part.list)}
            hintsId={hintsId}
            hints={part.list === lastList ? { level: anyLevels } : undefined}
            {...edits}
          />
        ),
      )}
    </div>
  );
}

const SILENT: Announcements = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

type Adding = {
  gap: number;
  level: "H2" | "H3";
  /** Under the list (the Add section button), or in the list at `gap`. */
  atFoot: boolean;
  /** The row to give focus back to when the new heading is cancelled. */
  returnKey: string | null;
};

type Drag = { key: string; gap: number | null; top: number };

/** The drop line's start: past the handle, and past one indent per level below H2. */
const DROP_INDENT = [
  "left-9 max-lg:left-12",
  "left-15 max-lg:left-16",
  "left-21 max-lg:left-20",
];

function OutlineGroup({
  list,
  label,
  listRows,
  rows,
  outline,
  title,
  editable,
  addable,
  hintsId,
  hints,
  onMove,
  onMoveTo,
  onChangeLevel,
  onRename,
  onRemove,
  onInsert,
}: Omit<OutlineTreeProps, "addableLists"> & {
  list: string;
  label: string;
  listRows: TreeRow[];
  addable: boolean;
  /** The page's one line of keyboard hints, which every list's tree grid is described by. */
  hintsId: string;
  /** Set on the last list, which shows that line; `level` when a list on the page has heading levels. */
  hints?: { level: boolean };
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Every section's plan shows from the start, so the outline reads in depth without a click
  // (rext-control#836); the ones a person folds away stay folded.
  const [closedPlans, setClosedPlans] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const planOpen = (key: string) => !closedPlans.has(key);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const rowEls = useRef(new Map<string, HTMLElement>());
  // Focus to give once the rows have re-rendered: a moved row (React moves its node, which drops
  // focus), the next row after a removal, a row just added (by its place), or the Add button.
  const pendingFocus = useRef<
    { key: string } | { index: number } | "add-button" | null
  >(null);
  const listRowsRef = useRef(listRows);
  const pointerY = useRef(0);
  const dragRef = useRef<Drag | null>(null);
  const stopTracking = useRef<(() => void) | null>(null);

  useEffect(() => {
    listRowsRef.current = listRows;
  });

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === "add-button") {
      addButtonRef.current?.focus();
      return;
    }
    const key = "key" in target ? target.key : listRows[target.index]?.key;
    const element = key ? rowEls.current.get(key) : undefined;
    if (key && element) {
      setActiveKey(key);
      element.focus();
    }
  });

  useEffect(() => () => stopTracking.current?.(), []);

  const currentKey = listRows.some((row) => row.key === activeKey)
    ? activeKey
    : (listRows[0]?.key ?? null);
  const canAdd = canAddSection(rows);
  const added = addedSections(rows);

  const registerRow = useCallback(
    (key: string, element: HTMLElement | null) => {
      if (element) rowEls.current.set(key, element);
      else rowEls.current.delete(key);
    },
    [],
  );

  const focusRow = (key: string | undefined) => {
    if (!key) return;
    setActiveKey(key);
    rowEls.current.get(key)?.focus();
  };

  const setPlan = (key: string, open: boolean) =>
    setClosedPlans((current) => {
      if (current.has(key) !== open) return current;
      const next = new Set(current);
      if (open) next.delete(key);
      else next.add(key);
      return next;
    });

  // A new heading half typed holds a place by its position, which a move or a removal would shift
  // under it: each of them closes it first.
  const move = (key: string, offset: -1 | 1) => {
    setAdding(null);
    if (onMove(key, offset)) pendingFocus.current = { key };
  };

  const changeLevel = (key: string, level: "H2" | "H3") => {
    setAdding(null);
    if (onChangeLevel(key, level)) pendingFocus.current = { key };
  };

  const remove = (key: string, index: number) => {
    setAdding(null);
    // The next section takes focus, else the one before: the block (the row and its subsections) goes.
    const next =
      listRows[blockEnd(listRows, index)] ?? listRows[index - 1] ?? null;
    if (onRemove(key) && next) pendingFocus.current = { key: next.key };
  };

  const startRename = (key: string) => {
    setMenuKey(null);
    setAdding(null);
    setRenamingKey(key);
  };

  const finishRename = (
    key: string,
    heading: string | null,
    refocus: boolean,
  ) => {
    if (heading) onRename(key, heading);
    setRenamingKey(null);
    if (refocus) pendingFocus.current = { key };
  };

  const startAdd = (next: Adding) => {
    setMenuKey(null);
    setRenamingKey(null);
    setAdding(next);
  };

  const finishAdd = (heading: string | null) => {
    if (!adding) return;
    setAdding(null);
    if (heading && onInsert(list, adding.gap, heading, adding.level)) {
      pendingFocus.current = { index: adding.gap };
    } else if (adding.atFoot) {
      pendingFocus.current = "add-button";
    } else if (adding.returnKey) {
      pendingFocus.current = { key: adding.returnKey };
    }
  };

  /** What a key does on a focused row; null when the key isn't the tree's. */
  const rowKeyAction = (
    event: KeyboardEvent<HTMLDivElement>,
    row: TreeRow,
    index: number,
  ): (() => void) | null => {
    const { key, altKey, shiftKey } = event;
    if (altKey) {
      if (!editable || shiftKey) return null;
      if (key === "ArrowUp") return () => move(row.key, -1);
      if (key === "ArrowDown") return () => move(row.key, 1);
      if (key === "ArrowRight") return () => changeLevel(row.key, "H3");
      if (key === "ArrowLeft") return () => changeLevel(row.key, "H2");
      return null;
    }
    if ((shiftKey && key === "F10") || key === "ContextMenu")
      return editable ? () => setMenuKey(row.key) : null;
    if (shiftKey) return null;
    switch (key) {
      case "ArrowUp":
        return () => focusRow(listRows[index - 1]?.key);
      case "ArrowDown":
        return () => focusRow(listRows[index + 1]?.key);
      case "Home":
        return () => focusRow(listRows[0]?.key);
      case "End":
        return () => focusRow(listRows.at(-1)?.key);
      case "ArrowRight":
        return () => setPlan(row.key, true);
      case "ArrowLeft":
        return () => setPlan(row.key, false);
      case " ":
        return () => setPlan(row.key, !planOpen(row.key));
      case "Enter":
      case "F2":
        return editable ? () => startRename(row.key) : null;
      case "Delete":
      case "Backspace":
        return editable ? () => remove(row.key, index) : null;
      default:
        return null;
    }
  };

  const onRowKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    row: TreeRow,
    index: number,
  ) => {
    const target = event.target as HTMLElement;
    // Keys from the open menu (a portal, which React still bubbles here) or from a field are theirs.
    if (!event.currentTarget.contains(target) || target.closest("input"))
      return;
    if (event.ctrlKey || event.metaKey) return;
    const action = rowKeyAction(event, row, index);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  // ── Dragging: the handle only, with our own drop line and place (no keyboard sensor: the keys above
  // and the menu move a section, and our live region says what happened) ──

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // The drop's place, measured from the rows on screen each time the pointer moves or the page
  // scrolls; a ref as well as state, so the drop reads what the pointer last chose.
  const measureDrop = useCallback(() => {
    const grid = gridRef.current;
    const state = dragRef.current;
    const current = listRowsRef.current;
    if (!grid || !state) return;
    const start = current.findIndex((row) => row.key === state.key);
    const rects: DOMRect[] = [];
    for (const row of current) {
      const rect = rowEls.current.get(row.key)?.getBoundingClientRect();
      if (!rect) return;
      rects.push(rect);
    }
    const last = rects.at(-1);
    if (start < 0 || !last) return;
    const gapTops = [...rects.map((rect) => rect.top), last.bottom];
    const gap = nearestGap(gapTops, dropGaps(current, start), pointerY.current);
    const top =
      gap === null ? 0 : gapTops[gap] - grid.getBoundingClientRect().top;
    if (gap === state.gap && top === state.top) return;
    dragRef.current = { ...state, gap, top };
    setDrag(dragRef.current);
  }, []);

  const endTracking = () => {
    stopTracking.current?.();
    stopTracking.current = null;
  };

  const cancelDrag = () => {
    endTracking();
    dragRef.current = null;
    setDrag(null);
  };

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    setMenuKey(null);
    setRenamingKey(null);
    setAdding(null);
    pointerY.current =
      "clientY" in activatorEvent && typeof activatorEvent.clientY === "number"
        ? activatorEvent.clientY
        : 0;
    dragRef.current = { key: String(active.id), gap: null, top: 0 };
    setDrag(dragRef.current);
    const onPointer = (event: PointerEvent) => {
      pointerY.current = event.clientY;
      measureDrop();
    };
    // The drag library tells of a drag's end only once its own state has caught up with the start,
    // so a press, move and release in one breath ends with no word from it. Its listener is on the
    // document and runs before this one on the window: a drag still held here is one it dropped.
    const settle = () => {
      if (dragRef.current) cancelDrag();
    };
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("scroll", measureDrop, true);
    window.addEventListener("pointerup", settle);
    window.addEventListener("pointercancel", settle);
    stopTracking.current = () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", measureDrop, true);
      window.removeEventListener("pointerup", settle);
      window.removeEventListener("pointercancel", settle);
    };
  };

  const onDragEnd = () => {
    endTracking();
    const state = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (state && state.gap !== null && onMoveTo(state.key, state.gap))
      pendingFocus.current = { key: state.key };
  };

  const dragStart = drag
    ? listRows.findIndex((row) => row.key === drag.key)
    : -1;
  const dragEnd = dragStart >= 0 ? blockEnd(listRows, dragStart) : -1;
  const dragRow = dragStart >= 0 ? listRows[dragStart] : null;
  const dropShown =
    !!drag &&
    drag.gap !== null &&
    drag.gap !== dragStart &&
    drag.gap !== dragEnd;
  // The hover line between rows: a pointer's way to add in place, when nothing else is going on.
  const insertable =
    addable && canAdd && !drag && !adding && renamingKey === null;

  const addForm = (gap: number) =>
    adding && !adding.atFoot && adding.gap === gap ? (
      // biome-ignore lint/a11y/useSemanticElements: a tree grid's row; a <tr> needs a <table>, which the layout check keeps to DataTable
      <div role="row" tabIndex={-1} className="py-1.5 pr-2 pl-1">
        {/* biome-ignore lint/a11y/useSemanticElements: the row's one cell (see the row) */}
        <div
          role="gridcell"
          tabIndex={-1}
          className={cn(
            adding.level === "H3" ? "pl-15 max-lg:pl-14" : "pl-9 max-lg:pl-1",
          )}
        >
          <AddHeading subsection={adding.level === "H3"} onDone={finishAdd} />
        </div>
      </div>
    ) : null;

  return (
    <section aria-labelledby={labelId} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={labelId} className="text-label text-muted-foreground">
          {label}
        </h3>
        <p className="text-caption text-muted-foreground num">
          {listSummary(rows, outline, list)}
        </p>
      </div>
      <div className="rounded-md border border-border bg-card">
        {title && (
          <div className="flex items-center gap-2.5 border-b border-border py-2.5 pr-3 pl-10 max-lg:pl-12">
            <LevelTag level="H1" />
            <span className="min-w-0 text-body font-semibold text-foreground">
              {title}
            </span>
            <span className="ml-auto shrink-0 text-caption text-muted-foreground max-md:hidden">
              The title, from step 4
            </span>
          </div>
        )}
        <DndContext
          sensors={sensors}
          accessibility={{
            announcements: SILENT,
            screenReaderInstructions: { draggable: "" },
            restoreFocus: false,
          }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={cancelDrag}
        >
          <div
            ref={gridRef}
            role="treegrid"
            aria-labelledby={labelId}
            aria-describedby={editable ? hintsId : undefined}
            aria-readonly={editable ? undefined : true}
            className="relative py-1"
          >
            {listRows.map((row, index) => {
              const end = blockEnd(listRows, index);
              const rank = levelRank(row);
              const next = listRows[index + 1];
              const place = siblingPlace(listRows, index);
              // The level a new row takes just above this one; none above an H4, where it would come
              // between a subsection and its H4s.
              const levelAbove = insertable
                ? insertLevelAt(listRows, index)
                : null;
              return (
                <Fragment key={row.key}>
                  {addForm(index)}
                  <OutlineRow
                    row={row}
                    position={place.position}
                    setSize={place.size}
                    plan={sectionPlan(outline, row.id)}
                    editable={editable}
                    active={row.key === currentKey}
                    lastInSection={!next || levelRank(next) < rank}
                    planOpen={planOpen(row.key)}
                    renaming={renamingKey === row.key}
                    menuOpen={menuKey === row.key}
                    moving={
                      dragStart >= 0 && index >= dragStart && index < dragEnd
                        ? index === dragStart
                          ? "head"
                          : "block"
                        : null
                    }
                    insertHere={
                      levelAbove === "H3"
                        ? "Add a subsection here"
                        : levelAbove === "H2"
                          ? "Add a section here"
                          : null
                    }
                    actions={rowActions({
                      row,
                      index,
                      end,
                      listRows,
                      rows,
                      addable,
                      canAdd,
                      onRename: () => startRename(row.key),
                      onMove: (offset) => move(row.key, offset),
                      onLevel: (level) => changeLevel(row.key, level),
                      onAdd: (gap, level) =>
                        startAdd({
                          gap,
                          level,
                          atFoot: false,
                          returnKey: row.key,
                        }),
                      onRemove: () => remove(row.key, index),
                    })}
                    registerRow={registerRow}
                    onKeyDown={(event) => onRowKeyDown(event, row, index)}
                    onFocus={() => setActiveKey(row.key)}
                    onTogglePlan={() => {
                      setPlan(row.key, !planOpen(row.key));
                      focusRow(row.key);
                    }}
                    onStartRename={() => startRename(row.key)}
                    onFinishRename={(heading, refocus) =>
                      finishRename(row.key, heading, refocus)
                    }
                    onMenuOpenChange={(open) =>
                      setMenuKey(open ? row.key : null)
                    }
                    onMenuCloseAutoFocus={(event) => {
                      event.preventDefault();
                      // A rename or a new heading the menu started keeps its field's focus, and a click
                      // elsewhere keeps what it focused; otherwise focus is back on the row.
                      const focused = document.activeElement;
                      if (!focused || focused.closest("input")) return;
                      const inRow = rowEls.current
                        .get(row.key)
                        ?.contains(focused);
                      if (focused === document.body || inRow) focusRow(row.key);
                    }}
                    onInsertHere={() => {
                      if (levelAbove)
                        startAdd({
                          gap: index,
                          level: levelAbove,
                          atFoot: false,
                          returnKey: null,
                        });
                    }}
                  />
                </Fragment>
              );
            })}
            {addForm(listRows.length)}
            {dropShown && dragRow && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute right-2 z-20 h-0.5 -translate-y-1/2 rounded-full bg-foreground",
                  DROP_INDENT[Math.min(levelRank(dragRow) - 2, 2)],
                )}
                style={{ top: drag?.top }}
              >
                <span className="absolute top-1/2 -left-1.5 size-2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card" />
              </div>
            )}
          </div>
          <DragOverlay dropAnimation={null}>
            {dragRow ? (
              <div className="flex min-h-10 items-center gap-2 rounded-sm bg-card py-0.5 pr-3 pl-1 shadow-overlay">
                <span className="grid h-8 w-6 shrink-0 cursor-grabbing place-items-center text-foreground">
                  <GripVertical className="size-4" />
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                {dragRow.level && <LevelTag level={dragRow.level} />}
                <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">
                  {dragRow.heading}
                  {dragEnd - dragStart > 1 && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      with its{" "}
                      {dragEnd - dragStart === 2
                        ? "subsection"
                        : `${dragEnd - dragStart - 1} subsections`}
                    </span>
                  )}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {addable && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2 pt-1 pb-2">
            {adding?.atFoot ? (
              <div className="w-full">
                <AddHeading subsection={false} onDone={finishAdd} />
              </div>
            ) : (
              <Button
                data-rec="show"
                ref={addButtonRef}
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={!canAdd}
                onClick={() =>
                  startAdd({
                    gap: listRows.length,
                    level: "H2",
                    atFoot: true,
                    returnKey: null,
                  })
                }
              >
                <Plus />
                Add section
              </Button>
            )}
            {added > 0 && (
              <span className="text-caption text-muted-foreground num">
                {added} of {MAX_ADDED_SECTIONS} new sections
                {!canAdd && ` · ${ADD_CAP_REASON.toLowerCase()}`}
              </span>
            )}
          </div>
        )}

        {editable && hints && (
          <p
            id={hintsId}
            className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-b-md border-t border-border bg-surface px-3 py-2.5 text-caption text-muted-foreground max-md:hidden"
          >
            <KeyHint keys={["↑", "↓"]} label="select" />
            <KeyHint keys={["Enter"]} label="rename" />
            <KeyHint keys={["Alt", "↑", "↓"]} label="move" />
            {hints.level && <KeyHint keys={["Alt", "←", "→"]} label="level" />}
            <KeyHint keys={["Delete"]} label="remove" />
            <span className="whitespace-nowrap">
              <Kbd>⋯</Kbd> or <Kbd>Shift</Kbd>+<Kbd>F10</Kbd> more
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

/** One hint: "Alt + ↑ ↓ move". */
function KeyHint({ keys, label }: { keys: string[]; label: string }) {
  const [first, ...rest] = keys;
  return (
    <span className="whitespace-nowrap">
      <Kbd>{first}</Kbd>
      {first === "Alt" ? "+" : " "}
      {rest.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}{" "}
      {label}
    </span>
  );
}

/** The row's … menu: every action, each with the keys that do the same from the row. */
function rowActions({
  row,
  index,
  end,
  listRows,
  rows,
  addable,
  canAdd,
  onRename,
  onMove,
  onLevel,
  onAdd,
  onRemove,
}: {
  row: TreeRow;
  index: number;
  end: number;
  listRows: TreeRow[];
  rows: TreeRow[];
  addable: boolean;
  canAdd: boolean;
  onRename: () => void;
  onMove: (offset: -1 | 1) => void;
  onLevel: (level: "H2" | "H3") => void;
  onAdd: (gap: number, level: "H2" | "H3") => void;
  onRemove: () => void;
}): DataTableRowAction[] {
  const addDisabled = canAdd ? false : ADD_CAP_REASON;
  // After the row's whole block (an H2's subsections, an H3's H4s), at its own level.
  const below = addable ? placeBelow(listRows, index) : null;
  return [
    {
      label: "Rename",
      icon: Pencil,
      shortcut: { label: "Enter", keys: "Enter" },
      onSelect: onRename,
    },
    {
      label: "Move up",
      icon: ArrowUp,
      shortcut: { label: "Alt+↑", keys: "Alt+ArrowUp" },
      onSelect: () => onMove(-1),
      disabled: moveTarget(listRows, index, -1) === null,
    },
    {
      label: "Move down",
      icon: ArrowDown,
      shortcut: { label: "Alt+↓", keys: "Alt+ArrowDown" },
      onSelect: () => onMove(1),
      disabled: moveTarget(listRows, index, 1) === null,
    },
    ...(row.level === "H2"
      ? [
          {
            label: "Make a subsection (H3)",
            icon: IndentIncrease,
            shortcut: { label: "Alt+→", keys: "Alt+ArrowRight" },
            onSelect: () => onLevel("H3"),
            disabled: canChangeLevel(rows, row.key, "H3")
              ? false
              : "The first section can't be a subsection",
          },
        ]
      : row.level === "H3"
        ? [
            {
              label: "Make a section (H2)",
              icon: IndentDecrease,
              shortcut: { label: "Alt+←", keys: "Alt+ArrowLeft" },
              onSelect: () => onLevel("H2"),
            },
          ]
        : []),
    ...(below
      ? [
          {
            label:
              below.level === "H3"
                ? "Add subsection below"
                : "Add section below",
            icon: Plus,
            onSelect: () => onAdd(below.gap, below.level),
            disabled: addDisabled,
          },
        ]
      : []),
    ...(addable && row.level === "H2"
      ? [
          {
            label: "Add subsection",
            icon: CornerDownRight,
            onSelect: () => onAdd(end, "H3"),
            disabled: addDisabled,
          },
        ]
      : []),
    {
      label: "Remove",
      icon: Trash2,
      destructive: true,
      shortcut: { label: "Delete", keys: "Delete" },
      onSelect: onRemove,
      disabled: canRemoveRow(rows, row.key)
        ? false
        : "An article keeps at least one section here",
    },
  ];
}

/** One level of indent with its 1 px guide down from the section above; it stops halfway on the last. */
function IndentGuide({ end }: { end: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative w-6 shrink-0 self-stretch before:absolute before:-inset-y-0.5 before:left-1/2 before:w-px before:bg-border-strong/60 max-lg:w-4",
        end && "before:bottom-1/2",
      )}
    />
  );
}

/** A level's text tag ("H2"), hidden from assistive technology: the row says its level itself. */
function LevelTag({ level }: { level: "H1" | HeadingLevel }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid h-5 min-w-7 shrink-0 place-items-center rounded-sm border px-1 font-mono text-caption font-medium",
        level === "H1" &&
          "border-border-strong bg-surface-inset text-foreground",
        level === "H2" && "border-border-strong bg-card text-foreground",
        (level === "H3" || level === "H4") &&
          "border-border bg-card text-muted-foreground",
      )}
    >
      {level}
    </span>
  );
}

function OutlineRow({
  row,
  position,
  setSize,
  plan,
  editable,
  active,
  lastInSection,
  planOpen,
  renaming,
  menuOpen,
  moving,
  insertHere,
  actions,
  registerRow,
  onKeyDown,
  onFocus,
  onTogglePlan,
  onStartRename,
  onFinishRename,
  onMenuOpenChange,
  onMenuCloseAutoFocus,
  onInsertHere,
}: {
  row: TreeRow;
  /** Its place among the rows of its level under the same parent, and how many they are. */
  position: number;
  setSize: number;
  plan: SectionPlan | null;
  editable: boolean;
  /** The row the tree grid's one Tab stop lands on. */
  active: boolean;
  lastInSection: boolean;
  planOpen: boolean;
  renaming: boolean;
  menuOpen: boolean;
  /** Part of the block being dragged: its head or a subsection under it. */
  moving: "head" | "block" | null;
  /** The hover line's label for adding just above this row; null when it isn't offered. */
  insertHere: string | null;
  actions: DataTableRowAction[];
  registerRow: (key: string, element: HTMLElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onTogglePlan: () => void;
  onStartRename: () => void;
  onFinishRename: (heading: string | null, refocus: boolean) => void;
  onMenuOpenChange: (open: boolean) => void;
  onMenuCloseAutoFocus: (event: Event) => void;
  onInsertHere: () => void;
}) {
  const id = useId();
  const headingId = `${id}-heading`;
  const wordsId = `${id}-words`;
  const planId = `${id}-plan`;
  const rank = levelRank(row);
  const depth = rank - 2;
  const { setNodeRef, setActivatorNodeRef, listeners } = useDraggable({
    id: row.key,
    disabled: !editable || renaming,
  });
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      setNodeRef(element);
      registerRow(row.key, element);
    },
    [setNodeRef, registerRow, row.key],
  );
  const hasPlan =
    !!plan &&
    (!!plan.description ||
      plan.questions.length > 0 ||
      plan.keyPoints.length > 0);
  const words = plan?.wordCount
    ? `~${plan.wordCount.toLocaleString()} words`
    : null;
  const isNew = row.id === null;
  const budget = words ? (
    words
  ) : isNew ? (
    <span className="inline-block rounded-sm border border-border bg-surface-inset px-1.5 text-caption text-foreground">
      New
    </span>
  ) : null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a tree grid's row; a <tr> needs a <table>, which the layout check keeps to DataTable
    <div
      ref={ref}
      role="row"
      aria-level={depth + 1}
      aria-posinset={position}
      aria-setsize={setSize}
      // While its heading is a field, the row keeps the heading it had as its name.
      aria-label={renaming ? row.heading : undefined}
      aria-labelledby={renaming ? undefined : headingId}
      aria-describedby={!renaming && (words || isNew) ? wordsId : undefined}
      tabIndex={active ? 0 : -1}
      data-row-key={row.key}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className={cn(
        "group/row relative rounded-sm outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        moving && "opacity-40",
      )}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: the row's one cell (see the row) */}
      <div role="gridcell" tabIndex={-1}>
        {insertHere && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={onInsertHere}
            className="absolute -top-1.5 right-11 left-7 z-10 h-3 cursor-pointer opacity-0 transition-opacity hover:opacity-100 max-lg:hidden"
          >
            <span className="absolute top-1/2 right-0 left-3 h-0.5 -translate-y-1/2 bg-border-strong" />
            <span className="absolute top-1/2 left-0 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-border-strong bg-card text-foreground">
              <Plus className="size-4" />
            </span>
            <span className="absolute top-1/2 left-7 -translate-y-1/2 bg-card px-1.5 text-caption text-muted-foreground">
              {insertHere}
            </span>
          </button>
        )}
        {renaming ? (
          <div className="flex items-start gap-1 py-2 pr-2 pl-1 max-lg:pl-2">
            <span
              className={cn(
                "shrink-0 max-lg:hidden",
                ["w-6", "w-13", "w-20"][Math.min(depth, 2)],
              )}
            />
            <RenameField row={row} onDone={onFinishRename} />
          </div>
        ) : (
          <div className="flex min-h-10 items-center gap-1 py-0.5 pr-2 pl-1 group-hover/row:bg-surface-inset group-focus-visible/row:bg-surface-inset max-lg:min-h-12 max-lg:pr-1">
            {editable ? (
              <span
                ref={setActivatorNodeRef}
                aria-hidden="true"
                {...listeners}
                className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-sm text-muted-foreground hover:bg-surface-inset active:cursor-grabbing max-lg:size-10"
              >
                <GripVertical className="size-4" />
              </span>
            ) : (
              <span className="w-6 shrink-0 max-lg:w-10" />
            )}
            {depth > 0 && <IndentGuide end={depth === 1 && lastInSection} />}
            {depth > 1 && <IndentGuide end={lastInSection} />}
            <button
              type="button"
              tabIndex={-1}
              aria-expanded={hasPlan ? planOpen : undefined}
              aria-controls={hasPlan && planOpen ? planId : undefined}
              onClick={onTogglePlan}
              onDoubleClick={editable ? onStartRename : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left max-lg:min-h-10",
                !hasPlan && "cursor-default",
              )}
            >
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)",
                  planOpen && "rotate-90",
                  !hasPlan && "invisible",
                )}
              />
              {row.level && <LevelTag level={row.level} />}
              <span className="min-w-0 flex-1">
                <span
                  id={headingId}
                  data-slot="outline-heading"
                  className={cn(
                    "text-body text-foreground",
                    rank === 2 && "font-medium",
                  )}
                >
                  {row.heading}
                </span>
                {moving === "head" && (
                  <span className="text-body text-muted-foreground">
                    {" "}
                    · moving
                  </span>
                )}
                {budget && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 block text-caption text-muted-foreground num lg:hidden"
                  >
                    {budget}
                  </span>
                )}
              </span>
            </button>
            {editable && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                tabIndex={-1}
                aria-label={`Rename ${row.heading}`}
                onClick={onStartRename}
                className="size-8 text-muted-foreground opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 max-lg:hidden"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {budget && (
              <span
                id={wordsId}
                className="w-21 shrink-0 text-right text-table text-muted-foreground num max-lg:hidden"
              >
                {budget}
              </span>
            )}
            {editable && (
              <DataTableRowActions
                label={row.heading}
                actions={actions}
                open={menuOpen}
                onOpenChange={onMenuOpenChange}
                onCloseAutoFocus={onMenuCloseAutoFocus}
                triggerTabIndex={-1}
              />
            )}
          </div>
        )}
        {hasPlan && planOpen && plan && !renaming && (
          <div
            id={planId}
            className={cn(
              "space-y-3 pt-1 pr-4 pb-3 text-table text-muted-foreground",
              [
                "pl-16 max-lg:pl-12",
                "pl-22 max-lg:pl-16",
                "pl-28 max-lg:pl-20",
              ][Math.min(depth, 2)],
            )}
          >
            {plan.description && (
              <p className="max-w-prose">{plan.description}</p>
            )}
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
      </div>
    </div>
  );
}

/**
 * A heading renamed in place: Enter or Save keeps it, Esc or Cancel puts the old one back, and leaving
 * the field keeps what was typed. On a phone the field takes the row's width with Cancel and Save
 * beneath, since a phone has no Esc key, and its 16 px text keeps the page from zooming.
 */
function RenameField({
  row,
  onDone,
}: {
  row: TreeRow;
  onDone: (heading: string | null, refocus: boolean) => void;
}) {
  const [draft, setDraft] = useState(row.heading);
  const formRef = useRef<HTMLFormElement>(null);
  const done = useRef(false);
  const finish = (keep: boolean, refocus: boolean) => {
    if (done.current) return;
    done.current = true;
    const heading = draft.trim();
    onDone(
      keep && heading && heading !== row.heading ? heading : null,
      refocus,
    );
  };
  return (
    <form
      ref={formRef}
      className="flex min-w-0 flex-1 items-start gap-2 max-lg:flex-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        finish(true, true);
      }}
    >
      {row.level && (
        <span className="mt-1.5 max-lg:mt-2.5">
          <LevelTag level={row.level} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Input
          autoFocus
          aria-label="Section heading"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            finish(false, true);
          }}
          onBlur={(event) => {
            if (formRef.current?.contains(event.relatedTarget as Node | null))
              return;
            finish(true, false);
          }}
          className="h-8 text-body max-lg:h-10 max-lg:text-base"
        />
        <p className="mt-1.5 text-caption text-muted-foreground max-lg:hidden">
          <Kbd>Enter</Kbd> to save · <Kbd>Esc</Kbd> to cancel
        </p>
        <div className="mt-2 flex justify-end gap-2 lg:hidden">
          <Button
            data-rec="show"
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => finish(false, true)}
          >
            Cancel
          </Button>
          <Button data-rec="show" type="submit" className="h-10">
            Save
          </Button>
        </div>
      </div>
      <Button
        data-rec="show"
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Save heading"
        className="size-8 max-lg:hidden"
      >
        <Check className="size-4" />
      </Button>
      <Button
        data-rec="show"
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancel renaming"
        className="size-8 text-muted-foreground max-lg:hidden"
        onClick={() => finish(false, true)}
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}

/** A heading typed in place, for a new section or a new subsection: Add, Cancel or Escape. */
function AddHeading({
  subsection,
  onDone,
}: {
  subsection: boolean;
  onDone: (heading: string | null) => void;
}) {
  const [heading, setHeading] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(heading.trim() ? heading : null);
      }}
    >
      <div className="min-w-0 flex-1 basis-60">
        <Input
          autoFocus
          aria-label={
            subsection ? "New subsection heading" : "New section heading"
          }
          placeholder={
            subsection
              ? "The subsection's heading"
              : "The new section's heading"
          }
          value={heading}
          onChange={(event) => setHeading(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            onDone(null);
          }}
          className="h-9 text-body max-lg:h-10 max-lg:text-base"
        />
      </div>
      <div className="flex gap-2 max-lg:ml-auto">
        <Button
          data-rec="show"
          type="submit"
          size="sm"
          className="max-lg:h-10"
          disabled={!heading.trim()}
        >
          Add
        </Button>
        <Button
          data-rec="show"
          type="button"
          variant="ghost"
          size="sm"
          className="max-lg:h-10"
          onClick={() => onDone(null)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
