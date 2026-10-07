"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HANDLE = "editor-drag-handle";
const isOnHandle = (element: HTMLElement) =>
  element.closest(`.${HANDLE}`) !== null;

/**
 * The drag handle (task 706): a grip beside the block under the pointer, to drag it to a new place;
 * a line shows where it would land. Lexical's own plugin does the dragging. The handle sits in the
 * gutter of the nearest `[data-drag-gutter]` round the editor, which the page provides where it has
 * the room (not on a phone, where dragging text blocks by touch works badly).
 */
export function DragHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [gutter, setGutter] = useState<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      editor.registerRootListener((root) => {
        setGutter(root?.closest<HTMLElement>("[data-drag-gutter]") ?? null);
      }),
    [editor],
  );

  if (!gutter) return null;
  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={gutter}
      menuRef={handleRef}
      targetLineRef={lineRef}
      isOnMenu={isOnHandle}
      menuComponent={
        <div
          ref={handleRef}
          className={`${HANDLE} not-prose absolute top-0 left-0 cursor-grab rounded-md p-0.5 text-muted-foreground opacity-0 will-change-transform hover:bg-muted active:cursor-grabbing`}
        >
          <GripVertical size={16} aria-hidden />
        </div>
      }
      targetLineComponent={
        <div
          ref={lineRef}
          className="pointer-events-none absolute top-0 left-0 h-1 rounded-full bg-primary opacity-0 will-change-transform"
        />
      }
    />
  );
}
