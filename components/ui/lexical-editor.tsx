"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  TRANSFORMERS,
  $convertToMarkdownString,
  $convertFromMarkdownString,
  type ElementTransformer,
} from "@lexical/markdown";
import {
  HeadingNode,
  QuoteNode,
  type HeadingTagType,
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { CodeNode } from "@lexical/code";
import {
  ListNode,
  ListItemNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  LinkNode,
  AutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type JSX,
} from "react";
import { log } from "@/lib/logger";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  $createParagraphNode,
  $insertNodes,
  createCommand,
  type LexicalCommand,
  type RangeSelection,
  DecoratorNode,
  type NodeKey,
  type LexicalNode,
  type SerializedLexicalNode,
  type EditorConfig,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Type,
  Undo,
  Redo,
  Link as LinkIcon,
  Check,
  X,
  ImageIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
const theme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-3xl font-bold mb-4 scroll-mt-20",
    h2: "text-2xl font-bold mb-3 scroll-mt-20",
    h3: "text-xl font-bold mb-2 scroll-mt-20",
  },
  list: {
    ul: "list-disc ml-4 mb-2",
    ol: "list-decimal ml-4 mb-2",
    listitem: "ml-1",
  },
  quote: "border-l-4 border-border pl-4 italic mb-2 text-muted-foreground",
  code: "bg-muted p-1 rounded font-mono text-sm",
  link: "text-primary hover:underline cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
  },
};

const lexicalLog = log.forComponent("LexicalEditor");

// ---------------------------------------------------------------------------
// ImageNode — custom DecoratorNode for inline images
// ---------------------------------------------------------------------------
export type SerializedImageNode = SerializedLexicalNode & {
  src: string;
  altText: string;
  width?: number;
  height?: number;
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ src, altText, width, height });
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      version: 1,
    };
  }

  // Required: tells Lexical how to create the DOM element (for plain serialisation)
  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <Image
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
        className="max-w-full rounded-md my-2 inline-block"
        style={{ maxHeight: 480 }}
      />
    );
  }

  isInline(): boolean {
    return false;
  }
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
}): ImageNode {
  return new ImageNode(src, altText, width, height);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

// ---------------------------------------------------------------------------
// INSERT_IMAGE_COMMAND
// ---------------------------------------------------------------------------
export type InsertImagePayload = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

// ---------------------------------------------------------------------------
// ImagePlugin — handles the INSERT_IMAGE_COMMAND
// ---------------------------------------------------------------------------
function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: InsertImagePayload) => {
        const imageNode = $createImageNode(payload);
        $insertNodes([imageNode]);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  return null;
}

// ---------------------------------------------------------------------------
// IMAGE_TRANSFORMER — teaches markdown serialiser about ImageNode
// Using ElementTransformer: the export fn is called for every top-level node
// and returns null for anything that isn't an ImageNode.
// ---------------------------------------------------------------------------
const IMAGE_TRANSFORMER: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) return null;
    return `![${node.__altText}](${node.__src})`;
  },
  // Matches a standalone markdown image line: ![alt](url)
  regExp: /^!\[([^\]]*)\]\(([^)]+)\)\s?$/,
  replace: (parentNode, _children, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({ src, altText: altText || "" });
    parentNode.replace(imageNode);
  },
  type: "element",
};

// All transformers — IMAGE_TRANSFORMER must come before the built-ins so it
// is checked first when exporting/importing ImageNodes.
const ALL_TRANSFORMERS = [IMAGE_TRANSFORMER, ...TRANSFORMERS];

// ---------------------------------------------------------------------------
// Nodes list
// ---------------------------------------------------------------------------
const NODES = [
  HeadingNode,
  QuoteNode,
  CodeNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  ImageNode,
];

// ---------------------------------------------------------------------------
// ToolbarButton
// ---------------------------------------------------------------------------
const ToolbarButton = ({
  active,
  onClick,
  children,
  title,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    className={cn(
      "p-2 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      active ? "bg-muted text-foreground" : "text-muted-foreground",
    )}
    title={title}
    type="button"
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// ImageInsertPopover — URL only
// ---------------------------------------------------------------------------
function ImageInsertPopover() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Snapshot the editor selection the moment the popover opens so we can
  // restore it before inserting — the editor loses focus once popover inputs
  // are interacted with, causing $insertNodes to mis-fire otherwise.
  const savedSelectionRef = useRef<RangeSelection | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setPreview(e.target.value || null);
    setError(null);
  };

  const handleInsert = useCallback(() => {
    const src = url.trim();
    if (!src) {
      setError("Please enter an image URL.");
      return;
    }
    // Restore the saved selection so the image lands at the original cursor.
    editor.update(() => {
      if (savedSelectionRef.current) {
        $setSelection(savedSelectionRef.current);
      }
      const imageNode = $createImageNode({
        src,
        altText: altText.trim() || "image",
      });
      $insertNodes([imageNode]);
    });
    // reset
    setUrl("");
    setAltText("");
    setPreview(null);
    setError(null);
    savedSelectionRef.current = null;
    setOpen(false);
  }, [editor, url, altText]);

  const handleOpenChange = (o: boolean) => {
    if (o) {
      // Snapshot the current selection before the popover steals focus.
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        savedSelectionRef.current = $isRangeSelection(sel)
          ? (sel.clone() as RangeSelection)
          : null;
      });
    } else {
      setUrl("");
      setAltText("");
      setPreview(null);
      setError(null);
      savedSelectionRef.current = null;
    }
    setOpen(o);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-2 rounded hover:bg-muted transition-colors",
            open ? "bg-muted text-foreground" : "text-muted-foreground",
          )}
          title="Insert Image"
          type="button"
        >
          <ImageIcon size={18} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4 space-y-3" align="end">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm leading-none">Insert Image</h4>
          <p className="text-xs text-muted-foreground">
            Paste an image URL below.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="img-url" className="text-xs">
            Image URL
          </Label>
          <Input
            id="img-url"
            placeholder="https://example.com/image.png"
            value={url}
            onChange={handleUrlChange}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsert();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="img-alt" className="text-xs">
            Alt text (optional)
          </Label>
          <Input
            id="img-alt"
            placeholder="Describe the image…"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Live preview */}
        {preview && (
          <div className="rounded-md overflow-hidden border border-border bg-muted/30 flex items-center justify-center max-h-40">
            <Image
              src={preview}
              alt="preview"
              className="max-h-40 max-w-full object-contain"
              onError={() => setError("Could not load image from this URL.")}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <X size={12} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => handleOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={handleInsert}
            type="button"
            disabled={!url.trim()}
          >
            <Check size={13} className="mr-1" /> Insert
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// ToolbarPlugin
// ---------------------------------------------------------------------------
function ToolbarPlugin({ className }: { className?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState("");
  const [blockType, setBlockType] = useState("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [tempLinkUrl, setTempLinkUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setIsLink(true);
        setCurrentLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setIsLink(true);
        setCurrentLinkUrl(node.getURL());
      } else {
        setIsLink(false);
        setCurrentLinkUrl("");
      }

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          if ($isListNode(parentList)) {
            const listType = parentList.getListType();
            setBlockType(listType === "number" ? "ol" : "ul");
          }
        } else {
          const type = element.getType();
          if (type === "heading") {
            const tag =
              (element as { getTag?: () => string }).getTag?.() || "paragraph";
            setBlockType(tag);
          } else {
            setBlockType(type);
          }
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const toggleList = (listType: "ol" | "ul") => {
    if (blockType === listType) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(
        listType === "ol"
          ? INSERT_ORDERED_LIST_COMMAND
          : INSERT_UNORDERED_LIST_COMMAND,
        undefined,
      );
    }
  };

  const applyLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, tempLinkUrl || null);
    setIsLinkPopoverOpen(false);
  }, [editor, tempLinkUrl]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setIsLinkPopoverOpen(false);
  }, [editor]);

  const onLinkPopoverOpenChange = (open: boolean) => {
    setIsLinkPopoverOpen(open);
    if (open) setTempLinkUrl(currentLinkUrl);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-border p-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex-wrap",
        className,
      )}
    >
      {/* Undo / Redo */}
      <ToolbarButton
        active={false}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings / paragraph */}
      <ToolbarButton
        active={blockType === "h1"}
        onClick={() => formatHeading("h1")}
        title="Heading 1"
      >
        <Heading1 size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h2"}
        onClick={() => formatHeading("h2")}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h3"}
        onClick={() => formatHeading("h3")}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "paragraph"}
        onClick={formatParagraph}
        title="Normal Text"
      >
        <Type size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists / Quote */}
      <ToolbarButton
        active={blockType === "ul"}
        onClick={() => toggleList("ul")}
        title="Bullet List"
      >
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "ol"}
        onClick={() => toggleList("ol")}
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "quote"}
        onClick={formatQuote}
        title="Quote"
      >
        <Quote size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Inline formatting */}
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold"
      >
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic"
      >
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline"
      >
        <Underline size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        title="Inline Code"
      >
        <CodeIcon size={18} />
      </ToolbarButton>

      {/* Link popover */}
      <Popover open={isLinkPopoverOpen} onOpenChange={onLinkPopoverOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              isLink || isLinkPopoverOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground",
            )}
            title="Link"
            type="button"
          >
            <LinkIcon size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Edit Link</h4>
              <p className="text-sm text-muted-foreground">
                Enter the URL for the selected text.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-4">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={tempLinkUrl}
                  onChange={(e) => setTempLinkUrl(e.target.value)}
                  className="h-8 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyLink();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {isLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeLink}
                  className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={14} className="mr-1" /> Remove
                </Button>
              )}
              <Button size="sm" onClick={applyLink} className="h-8 px-2">
                <Check size={14} className="mr-1" /> Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image popover — rendered inside LexicalComposer context */}
      <ImageInsertPopover />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MarkdownUpdatePlugin
// ---------------------------------------------------------------------------
function MarkdownUpdatePlugin({
  markdown,
  shouldUpdate,
  onUpdateComplete,
}: {
  markdown: string;
  shouldUpdate: boolean;
  onUpdateComplete: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (shouldUpdate) {
      editor.update(() => {
        $convertFromMarkdownString(markdown, ALL_TRANSFORMERS);
      });
      onUpdateComplete();
    }
  }, [shouldUpdate, markdown, editor, onUpdateComplete]);

  return null;
}

// ---------------------------------------------------------------------------
// LexicalEditorProps
// ---------------------------------------------------------------------------
interface LexicalEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  showDebug?: boolean;
  toolbarClass?: string;
}

// ---------------------------------------------------------------------------
// LexicalEditor (default export)
// ---------------------------------------------------------------------------
export default function LexicalEditor({
  initialValue = "",
  onChange,
  readOnly = false,
  showDebug = false,
  toolbarClass,
}: LexicalEditorProps) {
  const [markdownOutput, setMarkdownOutput] = useState(initialValue);
  const [shouldUpdateEditor, setShouldUpdateEditor] = useState(false);
  const lastEmittedValueRef = useRef(initialValue);

  useEffect(() => {
    if (initialValue !== lastEmittedValueRef.current) {
      setMarkdownOutput(initialValue);
      setShouldUpdateEditor(true);
      lastEmittedValueRef.current = initialValue;
    }
  }, [initialValue]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialValue excluded to prevent re-creating editor state
  const initialConfig = useMemo(
    () => ({
      namespace: "my-editor",
      theme,
      nodes: NODES,
      readOnly,
      onError: (error: Error) => {
        lexicalLog.error("Lexical editor runtime error", error);
      },
      editorState: (editor: unknown) => {
        (editor as { update: (fn: () => void) => void }).update(() => {
          if (initialValue) {
            try {
              $convertFromMarkdownString(initialValue, ALL_TRANSFORMERS);
            } catch (_e) {}
          }
        });
      },
    }),
    [readOnly],
  );

  function handleChange(editorState: unknown) {
    (editorState as { read: (fn: () => void) => void }).read(() => {
      const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
      if (!shouldUpdateEditor) {
        setMarkdownOutput(markdown);
      }
      if (onChange) {
        lastEmittedValueRef.current = markdown;
        onChange(markdown);
      }
    });
  }

  const handleMarkdownInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;
    setMarkdownOutput(newValue);
    setShouldUpdateEditor(true);
  };

  return (
    <div className="space-y-6">
      <LexicalComposer initialConfig={initialConfig}>
        <MarkdownUpdatePlugin
          markdown={markdownOutput}
          shouldUpdate={shouldUpdateEditor}
          onUpdateComplete={() => setShouldUpdateEditor(false)}
        />
        <div
          className={cn(
            "border rounded-md relative min-h-[200px] bg-background text-foreground flex flex-col",
            readOnly
              ? "border-none shadow-none bg-transparent"
              : "border-border shadow-sm",
          )}
        >
          {!readOnly && <ToolbarPlugin className={toolbarClass} />}
          <div className="relative grow">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    "min-h-[150px] outline-none",
                    readOnly ? "p-0" : "p-6",
                  )}
                />
              }
              placeholder={
                !readOnly ? (
                  <div className="text-muted-foreground absolute top-6 left-6 pointer-events-none select-none text-sm">
                    Type here (Markdown supported)…
                  </div>
                ) : null
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <ImagePlugin />
            <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
            {!readOnly && <OnChangePlugin onChange={handleChange} />}
          </div>
        </div>
      </LexicalComposer>

      {showDebug && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto">
            <h3 className="text-sm font-semibold mb-2 text-slate-400 uppercase tracking-wider">
              Editor Configuration
            </h3>
            <pre className="text-xs font-mono">
              {JSON.stringify(
                {
                  namespace: initialConfig.namespace,
                  theme: initialConfig.theme,
                  nodes: initialConfig.nodes.map((n: unknown) =>
                    (n as { getType?: () => string; name?: string }).getType
                      ? (n as { getType: () => string }).getType()
                      : (n as { name: string }).name,
                  ),
                  onError: "function(error)",
                  editorState: "function(editor) { ... }",
                },
                null,
                2,
              )}
            </pre>
          </div>
          <div className="bg-slate-50 border rounded-md p-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
              Markdown Input / Output
            </h3>
            <Textarea
              value={markdownOutput}
              onChange={handleMarkdownInputChange}
              className="font-mono text-xs min-h-[150px]"
              placeholder="# Type markdown here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
