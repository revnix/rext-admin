"use client";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  type ElementNode,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  Bold,
  Check,
  Heading2,
  Italic,
  Link2,
  type LucideIcon,
  Quote,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Shown = {
  top: number;
  left: number;
  bold: boolean;
  italic: boolean;
  link: boolean;
};

function Tool({
  icon: Icon,
  label,
  active = false,
  onPick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      // By pointer: on the press, before the text loses its selection.
      onMouseDown={(event) => {
        event.preventDefault();
        onPick();
      }}
      // By keyboard (Enter or Space on the focused button): a click with no pointer behind it.
      onClick={(event) => {
        if (event.detail === 0) onPick();
      }}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-md text-foreground hover:bg-muted",
        active && "bg-muted",
      )}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}

/** The bar's centre, moved in from an edge it would cross (with the page's 16 px gutter kept). */
const EDGE = 16;
function withinWindow(centre: number, width: number) {
  const half = width / 2;
  const least = half + EDGE;
  const most = window.innerWidth - half - EDGE;
  return least > most
    ? window.innerWidth / 2
    : Math.min(Math.max(centre, least), most);
}

/**
 * The floating toolbar (task 706): select some text and a small bar appears over it, with bold,
 * italic, link, heading and quote. It follows the selection and goes when the selection does.
 */
export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [shown, setShown] = useState<Shown | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  // The bar's own width, to keep all of it inside the window beside a narrow screen's edge.
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: measured again when the bar's content changes
  useLayoutEffect(() => {
    setWidth(barRef.current?.offsetWidth ?? 0);
  }, [shown === null, linking === null]);

  const read = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const native = window.getSelection();
      const root = editor.getRootElement();
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        selection.getTextContent().trim() === "" ||
        !native ||
        native.rangeCount === 0 ||
        !root?.contains(native.anchorNode)
      ) {
        setShown(null);
        setLinking(null);
        return;
      }
      const rect = native.getRangeAt(0).getBoundingClientRect();
      const node = selection.anchor.getNode();
      setShown({
        top: rect.top,
        left: rect.left + rect.width / 2,
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        link: $isLinkNode(node) || $isLinkNode(node.getParent()),
      });
    });
  }, [editor]);

  useEffect(() => {
    const stopUpdates = editor.registerUpdateListener(read);
    const stopSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        read();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    // The bar is fixed to the window, so it follows the text when anything scrolls or resizes.
    window.addEventListener("scroll", read, true);
    window.addEventListener("resize", read);
    return () => {
      stopUpdates();
      stopSelection();
      window.removeEventListener("scroll", read, true);
      window.removeEventListener("resize", read);
    };
  }, [editor, read]);

  if (!shown) return null;

  const block = (make: () => ElementNode) =>
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, make);
    });

  return createPortal(
    <div
      role="toolbar"
      aria-label="Format the selection"
      ref={barRef}
      style={{ top: shown.top, left: withinWindow(shown.left, width) }}
      className="not-prose fixed z-50 -mt-2 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-overlay"
    >
      {linking === null ? (
        <>
          <Tool
            icon={Bold}
            label="Bold"
            active={shown.bold}
            onPick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          />
          <Tool
            icon={Italic}
            label="Italic"
            active={shown.italic}
            onPick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          />
          <Tool
            icon={Link2}
            label={shown.link ? "Remove the link" : "Link"}
            active={shown.link}
            onPick={() =>
              shown.link
                ? editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                : setLinking("https://")
            }
          />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Tool
            icon={Heading2}
            label="Heading 2"
            onPick={() => block(() => $createHeadingNode("h2"))}
          />
          <Tool
            icon={Quote}
            label="Quote"
            onPick={() => block(() => $createQuoteNode())}
          />
        </>
      ) : (
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            const url = linking.trim();
            if (/^https?:\/\/\S+$/i.test(url) || /^mailto:\S+$/i.test(url)) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            }
            setLinking(null);
          }}
        >
          <Input
            autoFocus
            aria-label="Link address"
            value={linking}
            onChange={(event) => setLinking(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setLinking(null);
            }}
            className="h-8 w-56"
          />
          <button
            type="submit"
            aria-label="Add the link"
            className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-muted"
          >
            <Check size={16} aria-hidden />
          </button>
        </form>
      )}
    </div>,
    document.body,
  );
}
