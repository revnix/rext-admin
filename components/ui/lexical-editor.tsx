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
import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from "@lexical/extension";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  TRANSFORMERS,
  $convertToMarkdownString,
  $convertFromMarkdownString,
  type TextMatchTransformer,
  type MultilineElementTransformer,
  type ElementTransformer,
} from "@lexical/markdown";
import {
  TableNode,
  TableCellNode,
  TableRowNode,
  INSERT_TABLE_COMMAND,
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  TableCellHeaderStates,
} from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
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
  createContext,
  useContext,
  useId,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type JSX,
} from "react";
import {
  PARAGRAPH_ESCAPE_TRANSFORMER,
  tightenLooseLists,
} from "@/lib/editor/markdown-compat";
import { log } from "@/lib/logger";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  $getRoot,
  $getNodeByKey,
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
  TextNode,
  $createTextNode,
  $isTextNode,
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
  Table2 as TableIcon,
  Upload,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { altTextFor } from "@/lib/editor/alt-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { toAbsoluteMediaUrl } from "@/lib/media-url";
import { useCurrentWorkspaceId } from "@/stores/workspace/use-workspace-context-store";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
/** The editor's theme, nodes and markdown transformers are exported for the
 *  round-trip test (__tests__/components/lexical-round-trip.test.ts). */
// The article's typography comes from `prose prose-app` on the content area (globals.css,
// design/app-language.md §7), the same stylesheet for the preview and the editor; the theme
// keeps only what the editor itself needs.
export const theme = {
  paragraph: "",
  heading: {
    h1: "scroll-mt-20",
    h2: "scroll-mt-20",
    h3: "scroll-mt-20",
  },
  list: {
    // prose draws the markers: discs and numbers, in the muted colour.
    ul: "",
    ol: "",
    listitem: "",
    // Lexical wraps a nested list in an item of its own, which must not show a marker.
    nested: { listitem: "list-none" },
  },
  quote: "",
  code: "",
  link: "cursor-pointer",
  text: {
    bold: "",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
  },
  hr: "",
  table: "",
  tableRow: "",
  tableCell: "relative min-w-0 w-auto align-top outline-none",
  tableCellHeader: "",
  tableScrollableWrapper: "overflow-x-auto w-full",
};

const lexicalLog = log.forComponent("LexicalEditor");

// ---------------------------------------------------------------------------
// Manual-upload image placeholder — a non-fetchable `src` scheme the backend
// embeds (as ordinary markdown image syntax) at the spot its image-planning
// pipeline suggested an image, whenever real image generation is disabled
// (cost control). Recognizing the scheme here lets the same ImageNode /
// markdown transformer round-trip it untouched, while rendering an
// upload/dismiss slot instead of a broken <img>. Never sent to a publish
// target unresolved — the backend strips any leftover marker at publish time.
// ---------------------------------------------------------------------------
const IMAGE_PLACEHOLDER_SCHEME = "rext-placeholder:";

// Lets a read-only editor ask its host page to switch into Edit mode (set when
// the viewer may edit). Absent when they may not.
const RequestEditContext = createContext<(() => void) | undefined>(undefined);

function isImagePlaceholderSrc(src: string): boolean {
  return src.startsWith(IMAGE_PLACEHOLDER_SCHEME);
}

function ImagePlaceholderSlot({
  editor,
  nodeKey,
  altText,
}: {
  editor: import("lexical").LexicalEditor;
  nodeKey: string;
  altText: string;
}) {
  const workspaceId = useCurrentWorkspaceId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isEditable = editor.isEditable();
  const onRequestEdit = useContext(RequestEditContext);

  const requireEditMode = useCallback(() => {
    if (onRequestEdit) {
      onRequestEdit();
      toast.info("Opening the editor: choose your image there.");
      return;
    }
    toast.info("Editing requires Editor role or above.");
  }, [onRequestEdit]);

  const applyImage = useCallback(
    (url: string, alt: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setSrc(url);
          if (alt) node.setAltText(alt);
        }
      });
    },
    [editor, nodeKey],
  );

  const handleUploadClick = useCallback(() => {
    if (!isEditable) {
      requireEditMode();
      return;
    }
    if (!workspaceId) {
      toast.error("No workspace selected — cannot upload.");
      return;
    }
    fileInputRef.current?.click();
  }, [isEditable, requireEditMode, workspaceId]);

  // A slot the person put in has no description. It is asked for once a file is chosen: nothing
  // on the page can add one to the image afterwards, and without it the image would be published
  // as decoration.
  const [chosen, setChosen] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const descriptionId = useId();

  const upload = useCallback(
    async (file: File, alt: string) => {
      if (!workspaceId) return;
      setUploading(true);
      try {
        const media = await apiClient.content.uploadBlogImage(
          workspaceId,
          file,
        );
        const uploadedSrc = toAbsoluteMediaUrl(media.public_url);
        if (!uploadedSrc) {
          toast.error("Upload succeeded but no image URL was returned.");
          return;
        }
        applyImage(uploadedSrc, alt);
        toast.success("Image added.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [workspaceId, applyImage],
  );

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so re-picking the same file fires change again.
      e.target.value = "";
      if (!file || !workspaceId) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
        toast.error("Image exceeds 20MB. Please choose a smaller file.");
        return;
      }
      if (!altText) {
        setDescription("");
        setChosen(file);
        return;
      }
      await upload(file, altText);
    },
    [workspaceId, altText, upload],
  );

  const describeAndUpload = (event: React.FormEvent) => {
    event.preventDefault();
    const file = chosen;
    setChosen(null);
    if (file) void upload(file, altTextFor(description));
  };

  const handleDismiss = useCallback(() => {
    if (!isEditable) {
      requireEditMode();
      return;
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey, isEditable, requireEditMode]);

  return (
    <span className="not-prose my-4 inline-flex w-full flex-col gap-2.5 rounded-md border border-dashed border-border bg-muted/30 px-4 py-4 text-sm align-top">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <span className="inline-flex items-start gap-2 text-muted-foreground">
        <ImageIcon size={16} className="mt-0.5 shrink-0" />
        <span>
          {/* A slot with no description is one the person put in themselves. */}
          {altText
            ? `Suggested image: ${altText} — optional. Upload one here, or remove this slot and publish without it.`
            : "Upload an image here, or remove this slot."}
        </span>
      </span>
      <span className="inline-flex items-center gap-2">
        <Button
          data-rec="show"
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Upload size={14} className="mr-1.5" />
          )}
          Upload image
        </Button>
        <Button
          data-rec="show"
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-muted-foreground"
          onClick={handleDismiss}
        >
          <X size={14} className="mr-1.5" />
          Remove
        </Button>
      </span>
      {/* Drawn outside the text (a portal), so typing in it is not typing in the article. */}
      <Dialog
        open={chosen !== null}
        onOpenChange={(open) => !open && setChosen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Describe the image</DialogTitle>
            <DialogDescription>
              A few words for people who can't see it, and for search engines.
              It becomes the image's alt text.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={describeAndUpload} className="space-y-4">
            <div className="space-y-2">
              <Label data-rec="show" htmlFor={descriptionId}>
                Description
              </Label>
              <Input
                id={descriptionId}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A host recording at a desk microphone"
              />
            </div>
            <DialogFooter>
              <Button
                data-rec="show"
                type="button"
                variant="outline"
                onClick={() => setChosen(null)}
              >
                Cancel
              </Button>
              <Button
                data-rec="show"
                type="submit"
                disabled={altTextFor(description) === ""}
              >
                Add image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ImageNodeComponent — renders image with a remove button overlay
// ---------------------------------------------------------------------------
function ImageNodeComponent({
  editor,
  nodeKey,
  src,
  altText,
  width,
  height,
}: {
  editor: import("lexical").LexicalEditor;
  nodeKey: string;
  src: string;
  altText: string;
  width?: number;
  height?: number;
}) {
  // In read-only mode OnChangePlugin is not mounted, so a removal here would
  // never reach the parent's body — the image would vanish from view, come
  // back on the next remount, and still be published. Removal belongs to Edit
  // mode, matching ImagePlaceholderSlot.
  const isEditable = editor.isEditable();

  const handleRemove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey]);

  if (isImagePlaceholderSrc(src)) {
    return (
      <ImagePlaceholderSlot
        editor={editor}
        nodeKey={nodeKey}
        altText={altText}
      />
    );
  }

  return (
    <span className="relative inline-block max-w-full group my-2">
      <Image
        src={src}
        alt={altText}
        width={width || 500}
        height={height || 300}
        className="max-w-full h-auto rounded-md block"
        style={{ maxHeight: 480 }}
        unoptimized
      />
      {isEditable && (
        <button
          data-rec="show"
          type="button"
          title="Remove image"
          onClick={handleRemove}
          className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer bg-background/90 hover:bg-destructive border border-border hover:border-destructive text-muted-foreground hover:text-destructive-foreground rounded-md w-7 h-7 flex items-center justify-center shadow-sm"
        >
          <X size={13} />
        </button>
      )}
    </span>
  );
}

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
    // An inline-block shrinks to its image, so without a cap a wide image runs past
    // the article on a phone.
    span.style.maxWidth = "100%";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(editor: import("lexical").LexicalEditor): JSX.Element {
    const nodeKey = this.__key;
    const src = this.__src;
    const altText = this.__altText;
    const width = this.__width;
    const height = this.__height;
    return (
      <ImageNodeComponent
        editor={editor}
        nodeKey={nodeKey}
        src={src}
        altText={altText}
        width={width}
        height={height}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  // Used to turn a manual-upload placeholder (see IMAGE_PLACEHOLDER_SCHEME)
  // into a real image in place once the user uploads one, without needing to
  // replace the node (which would lose its position/selection context).
  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
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

/**
 * An empty upload slot, as the "/" menu's Image block puts in (task 706): the same placeholder the
 * pipeline leaves where it suggests an image, so it saves, loads and is left out of a publish the
 * same way until an image is uploaded into it.
 */
export function $createImageSlotNode(): ImageNode {
  return $createImageNode({
    src: `${IMAGE_PLACEHOLDER_SCHEME}${crypto.randomUUID()}`,
    altText: "",
  });
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
// Nodes list
// ---------------------------------------------------------------------------
export const NODES = [
  HeadingNode,
  QuoteNode,
  CodeNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  ImageNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
];

const UNDERLINE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [TextNode],
  export: (node, _exportChildren, exportFormat) => {
    if (!$isTextNode(node) || !node.hasFormat("underline")) return null;
    return `<u>${exportFormat(node, node.getTextContent())}</u>`;
  },
  importRegExp: /<u>(.*?)<\/u>/,
  regExp: /<u>(.*?)<\/u>$/,
  replace: (node: TextNode, match: RegExpMatchArray) => {
    const [, text] = match;
    const underlineNode = $createTextNode(text);
    underlineNode.setFormat("underline");
    node.replace(underlineNode);
  },
  trigger: ">",
  type: "text-match",
};

const IMAGE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) return null;
    const src = node.__src;
    const alt = node.__altText || "";
    const title = node.__altText || "";
    return `![${alt}](${src} "${title}")`;
  },
  importRegExp: /!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)/,
  regExp: /!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({ src, altText: altText || "" });
    textNode.replace(imageNode);
  },
  trigger: ")",
  type: "text-match",
};

// ---------------------------------------------------------------------------
// Inline markdown helpers for table cell import / export
// ---------------------------------------------------------------------------
function parseInlineMarkdown(text: string): TextNode[] {
  const pattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|~~(.+?)~~|`(.+?)`|\*(.+?)\*)/g;
  const nodes: TextNode[] = [];
  let lastIndex = 0;
  let match = pattern.exec(text);
  while (match !== null) {
    if (match.index > lastIndex)
      nodes.push($createTextNode(text.slice(lastIndex, match.index)));
    const full = match[0];
    let node: TextNode;
    if (full.startsWith("***")) {
      node = $createTextNode(match[2] ?? "");
      node.toggleFormat("bold");
      node.toggleFormat("italic");
    } else if (full.startsWith("**")) {
      node = $createTextNode(match[3] ?? "");
      node.toggleFormat("bold");
    } else if (full.startsWith("~~")) {
      node = $createTextNode(match[4] ?? "");
      node.toggleFormat("strikethrough");
    } else if (full[0] === "`") {
      node = $createTextNode(match[5] ?? "");
      node.toggleFormat("code");
    } else {
      node = $createTextNode(match[6] ?? "");
      node.toggleFormat("italic");
    }
    nodes.push(node);
    lastIndex = match.index + full.length;
    match = pattern.exec(text);
  }
  if (lastIndex < text.length)
    nodes.push($createTextNode(text.slice(lastIndex)));
  return nodes.length ? nodes : [$createTextNode(text)];
}

function serializeCellToMarkdown(cell: TableCellNode): string {
  let result = "";
  for (const block of cell.getChildren()) {
    const getChildren = (
      block as unknown as { getChildren?: () => LexicalNode[] }
    ).getChildren;
    const inlines: LexicalNode[] =
      typeof getChildren === "function" ? getChildren.call(block) : [block];
    for (const child of inlines) {
      if ($isTextNode(child)) {
        let t = child.getTextContent();
        if (child.hasFormat("code")) t = `\`${t}\``;
        if (child.hasFormat("strikethrough")) t = `~~${t}~~`;
        if (child.hasFormat("bold") && child.hasFormat("italic"))
          t = `***${t}***`;
        else if (child.hasFormat("bold")) t = `**${t}**`;
        else if (child.hasFormat("italic")) t = `*${t}*`;
        result += t;
      } else {
        result += child.getTextContent();
      }
    }
  }
  return result.trim().replace(/\|/g, "\\|");
}

// ---------------------------------------------------------------------------
// TABLE_TRANSFORMER — GFM table import/export
// ---------------------------------------------------------------------------
const TABLE_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [TableNode, TableCellNode, TableRowNode],
  export: (node) => {
    if (!$isTableNode(node)) return null;
    const rows = node.getChildren();
    if (!rows.length) return null;
    const lines: string[] = [];
    rows.forEach((row, rowIndex) => {
      if (!$isTableRowNode(row)) return;
      const cells = row.getChildren();
      const cellTexts = cells.map((cell) => {
        if (!$isTableCellNode(cell)) return "";
        return serializeCellToMarkdown(cell);
      });
      lines.push(`| ${cellTexts.join(" | ")} |`);
      if (rowIndex === 0) {
        lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
      }
    });
    return lines.join("\n");
  },
  regExpStart: /^\|.+\|/,
  replace: () => false,
  handleImportAfterStartMatch: ({
    lines,
    rootNode,
    startLineIndex,
    startMatch,
  }) => {
    const allTableLines: string[] = [startMatch[0]];
    let currentIndex = startLineIndex + 1;
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      if (!line.trim().startsWith("|")) break;
      allTableLines.push(line);
      currentIndex++;
    }

    const parseRow = (rowText: string): string[] =>
      rowText
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());

    const isSeparator = (line: string): boolean => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
      const cells = trimmed.slice(1, -1).split("|");
      return cells.length > 0 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
    };

    const dataRows = allTableLines.filter((line) => !isSeparator(line));
    if (!dataRows.length) return null;

    const tableNode = $createTableNode();
    dataRows.forEach((rowText, rowIndex) => {
      const cells = parseRow(rowText);
      const rowNode = $createTableRowNode();
      cells.forEach((cellText) => {
        const cellNode = $createTableCellNode(
          rowIndex === 0
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS,
        );
        const paragraph = $createParagraphNode();
        if (cellText)
          parseInlineMarkdown(cellText).forEach((n) => {
            paragraph.append(n);
          });
        cellNode.append(paragraph);
        rowNode.append(cellNode);
      });
      tableNode.append(rowNode);
    });
    rootNode.append(tableNode);
    return [true, currentIndex - 1];
  },
  type: "multiline-element",
};

const HORIZONTAL_RULE_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? "---" : null),
  regExp: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  replace: (parentNode) => {
    parentNode.replace($createHorizontalRuleNode());
  },
  type: "element",
};

export const CUSTOM_TRANSFORMERS = [
  HORIZONTAL_RULE_TRANSFORMER,
  TABLE_TRANSFORMER,
  UNDERLINE_TRANSFORMER,
  IMAGE_TRANSFORMER,
  ...TRANSFORMERS,
  PARAGRAPH_ESCAPE_TRANSFORMER,
];

/** Loads an article's markdown into the editor, the one way the editor and the
 *  round-trip test both import it. */
export function $importArticleMarkdown(markdown: string) {
  $convertFromMarkdownString(tightenLooseLists(markdown), CUSTOM_TRANSFORMERS);
}

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
      "p-2 rounded-md hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
      active
        ? "bg-muted text-foreground ring-1 ring-inset ring-border-strong"
        : "text-muted-foreground",
    )}
    title={title}
    type="button"
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// ImageInsertPopover — device upload or URL, inserted at the cursor
// ---------------------------------------------------------------------------
// Max upload size for editor image uploads (matches the media library dialog).
const IMAGE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

function ImageInsertPopover() {
  const [editor] = useLexicalComposerContext();
  const workspaceId = useCurrentWorkspaceId();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot the editor selection the moment the popover opens so we can
  // restore it before inserting — the editor loses focus once popover inputs
  // are interacted with, causing $insertNodes to mis-fire otherwise.
  const savedSelectionRef = useRef<RangeSelection | null>(null);

  // Insert an image at the snapshot selection so it lands at the original
  // cursor regardless of where focus went (URL field or file picker).
  const insertAtSavedSelection = useCallback(
    (src: string, alt: string) => {
      editor.update(() => {
        if (savedSelectionRef.current) {
          $setSelection(savedSelectionRef.current);
        }
        const imageNode = $createImageNode({
          src,
          altText: altTextFor(alt) || "image",
        });
        $insertNodes([imageNode]);
      });
    },
    [editor],
  );

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
    insertAtSavedSelection(src, altText.trim());
    // reset
    setUrl("");
    setAltText("");
    setPreview(null);
    setError(null);
    savedSelectionRef.current = null;
    setOpen(false);
  }, [url, altText, insertAtSavedSelection]);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so re-picking the same file fires change again.
      e.target.value = "";
      if (!file) return;

      if (!workspaceId) {
        setError("No workspace selected — cannot upload.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }
      if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
        setError("Image exceeds 20MB. Please choose a smaller file.");
        return;
      }

      setError(null);
      setUploading(true);
      try {
        const media = await apiClient.content.uploadBlogImage(
          workspaceId,
          file,
        );
        const src = toAbsoluteMediaUrl(media.public_url);
        if (!src) {
          setError("Upload succeeded but no image URL was returned.");
          return;
        }
        // Fill the URL + preview and leave the Alt text field for the user to
        // enter their own. Insertion happens on the Insert button, so uploaded
        // images get a custom alt text just like pasted URLs (no filename default).
        setUrl(src);
        setPreview(src);
        toast.success("Image uploaded — add alt text (optional), then Insert");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [workspaceId],
  );

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
          data-rec="show"
          className={cn(
            "p-2 rounded-md hover:bg-muted transition-colors cursor-pointer",
            open ? "bg-muted text-foreground" : "text-muted-foreground",
          )}
          title="Insert Image"
          type="button"
        >
          <ImageIcon size={16} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-4 space-y-3 max-h-[70vh] overflow-y-auto"
        align="end"
      >
        <div className="space-y-1">
          <h4 className="font-semibold text-sm leading-none">Insert Image</h4>
          <p className="text-xs text-muted-foreground">
            Upload from your device or paste an image URL.
          </p>
        </div>

        {/* Upload from device */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button
          data-rec="show"
          variant="outline"
          size="sm"
          className="h-8 w-full"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          disabled={uploading || !workspaceId}
        >
          {uploading ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Upload size={14} className="mr-1.5" />
          )}
          {uploading ? "Uploading…" : "Upload from device"}
        </Button>

        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Label data-rec="show" htmlFor="img-url" className="text-xs">
            Image URL
          </Label>
          <Input
            id="img-url"
            placeholder="https://example.com/image.png"
            value={url}
            onChange={handleUrlChange}
            className="h-8 text-sm"
            disabled={uploading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsert();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label data-rec="show" htmlFor="img-alt" className="text-xs">
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
              width={300}
              height={200}
              className="max-h-40 max-w-full object-contain"
              unoptimized
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
            data-rec="show"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => handleOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            data-rec="show"
            size="sm"
            className="h-8"
            onClick={handleInsert}
            type="button"
            disabled={!url.trim() || uploading}
          >
            <Check size={13} className="mr-1" /> Insert
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// TableInsertPopover
// ---------------------------------------------------------------------------
function TableInsertPopover() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");

  const handleInsert = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows,
      columns: cols,
      includeHeaders: { rows: true, columns: false },
    });
    setOpen(false);
    setRows("3");
    setCols("3");
  }, [editor, rows, cols]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-rec="show"
          className={cn(
            "p-2 rounded-md hover:bg-muted transition-colors cursor-pointer",
            open ? "bg-muted text-foreground" : "text-muted-foreground",
          )}
          title="Insert Table"
          type="button"
        >
          <TableIcon size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 space-y-3" align="end">
        <h4 className="font-semibold text-sm leading-none">Insert Table</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label data-rec="show" htmlFor="tbl-rows" className="text-xs">
              Rows
            </Label>
            <Input
              id="tbl-rows"
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label data-rec="show" htmlFor="tbl-cols" className="text-xs">
              Columns
            </Label>
            <Input
              id="tbl-cols"
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            data-rec="show"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            data-rec="show"
            size="sm"
            className="h-8"
            onClick={handleInsert}
            type="button"
            disabled={!rows || !cols || Number(rows) < 1 || Number(cols) < 1}
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
      // getTopLevelElementOrThrow() returns TableNode when the cursor is inside
      // a table cell. Walk up instead to find the nearest block that is a direct
      // child of root OR a table cell so the toolbar reflects the real block type.
      let element: LexicalNode =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      if (anchorNode.getKey() !== "root") {
        let current: LexicalNode = anchorNode;
        while (current) {
          const p = current.getParent();
          if (!p) break;
          if ($isTableCellNode(p) || p.getKey() === "root") {
            element = current;
            break;
          }
          current = p;
        }
      }
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          setBlockType(element.getListType() === "number" ? "ol" : "ul");
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
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings / paragraph */}
      <ToolbarButton
        active={blockType === "h1"}
        onClick={() => formatHeading("h1")}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h2"}
        onClick={() => formatHeading("h2")}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h3"}
        onClick={() => formatHeading("h3")}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "paragraph"}
        onClick={formatParagraph}
        title="Normal Text"
      >
        <Type size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists / Quote */}
      <ToolbarButton
        active={blockType === "ul"}
        onClick={() => toggleList("ul")}
        title="Bullet List"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "ol"}
        onClick={() => toggleList("ol")}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "quote"}
        onClick={formatQuote}
        title="Quote"
      >
        <Quote size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Inline formatting */}
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        title="Inline Code"
      >
        <CodeIcon size={16} />
      </ToolbarButton>

      {/* Link popover */}
      <Popover open={isLinkPopoverOpen} onOpenChange={onLinkPopoverOpenChange}>
        <PopoverTrigger asChild>
          <button
            data-rec="show"
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors cursor-pointer",
              isLink || isLinkPopoverOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground",
            )}
            title="Link"
            type="button"
          >
            <LinkIcon size={16} />
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
                <Label data-rec="show" htmlFor="link-url">
                  URL
                </Label>
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
                  data-rec="show"
                  variant="outline"
                  size="sm"
                  onClick={removeLink}
                  className="h-8 px-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                >
                  <X size={14} className="mr-1" /> Remove
                </Button>
              )}
              <Button
                data-rec="show"
                size="sm"
                onClick={applyLink}
                className="h-8 px-2"
              >
                <Check size={14} className="mr-1" /> Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image popover — rendered inside LexicalComposer context */}
      <ImageInsertPopover />

      {/* Table popover */}
      <TableInsertPopover />
    </div>
  );
}

// ---------------------------------------------------------------------------
// NewTabLinkPlugin — makes all links open in a new tab
// ---------------------------------------------------------------------------
function NewTabLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // One-time pass: fix any links already in the editor state on mount
    editor.update(() => {
      const root = $getRoot();
      // Walk all nodes via getChildren recursively
      const walk = (node: import("lexical").LexicalNode) => {
        if ($isLinkNode(node) && node.getTarget() !== "_blank") {
          node.setTarget("_blank");
          node.setRel("noopener noreferrer");
        }
        if ("getChildren" in node) {
          for (const child of (
            node as import("lexical").ElementNode
          ).getChildren()) {
            walk(child);
          }
        }
      };
      walk(root);
    });

    // Ongoing: fix any links created or updated after mount
    return editor.registerMutationListener(LinkNode, (mutations) => {
      editor.update(() => {
        for (const [key, mutation] of mutations) {
          if (mutation === "created" || mutation === "updated") {
            const node = $getNodeByKey(key);
            if ($isLinkNode(node) && node.getTarget() !== "_blank") {
              node.setTarget("_blank");
              node.setRel("noopener noreferrer");
            }
          }
        }
      });
    });
  }, [editor]);

  return null;
}
// ---------------------------------------------------------------------------
// ReadOnlyLinkClickPlugin — intercepts link clicks via DOM when editor is readonly
// (editor.update() is blocked in readonly mode, so we can't mutate node targets)
// ---------------------------------------------------------------------------
function ReadOnlyLinkClickPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let removeListeners: (() => void) | null = null;

    const unregister = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (prevRootElement && removeListeners) {
          removeListeners();
          removeListeners = null;
        }
        if (rootElement) {
          const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a");
            if (anchor?.href) {
              e.preventDefault();
              window.open(anchor.href, "_blank", "noopener,noreferrer");
            }
          };
          const blockDrag = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
          };
          rootElement.addEventListener("click", handleClick);
          rootElement.addEventListener("drop", blockDrag);
          rootElement.addEventListener("dragover", blockDrag);
          rootElement.addEventListener("dragenter", blockDrag);
          removeListeners = () => {
            rootElement.removeEventListener("click", handleClick);
            rootElement.removeEventListener("drop", blockDrag);
            rootElement.removeEventListener("dragover", blockDrag);
            rootElement.removeEventListener("dragenter", blockDrag);
          };
        }
      },
    );

    return () => {
      unregister();
      removeListeners?.();
    };
  }, [editor]);

  return null;
}

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
        $importArticleMarkdown(markdown);
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
  /** Called when a read-only editor needs Edit mode (e.g. image upload). */
  onRequestEdit?: () => void;
  /** False for a page that brings its own tools (the full-screen editor): no fixed toolbar. */
  toolbar?: boolean;
  /** More Lexical plugins, mounted inside the composer while editing (a floating toolbar, a block menu). */
  plugins?: React.ReactNode;
  /** No frame or padding round the text: the page around it is the frame. */
  bare?: boolean;
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
  onRequestEdit,
  toolbar = true,
  plugins,
  bare = false,
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
      editable: !readOnly,
      onError: (error: Error) => {
        lexicalLog.error("Lexical editor runtime error", error);
      },
      editorState: (editor: unknown) => {
        (editor as { update: (fn: () => void) => void }).update(() => {
          if (initialValue) {
            try {
              $importArticleMarkdown(initialValue);
            } catch (_e) {}
          }
        });
      },
    }),
    [readOnly],
  );

  function handleChange(editorState: unknown) {
    (editorState as { read: (fn: () => void) => void }).read(() => {
      const root = $getRoot();
      const hasImages = root.getChildren().some((n) => $isImageNode(n));

      let markdown: string;

      if (!hasImages) {
        markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
      } else {
        // Walk each top-level child; ImageNodes are serialized directly,
        // everything else is serialized via $convertToMarkdownString on a
        // temporary single-paragraph basis by reading its text content.
        // We rebuild the full markdown by processing children in order.
        const rootChildren = root.getChildren();
        const parts: string[] = [];

        for (const child of rootChildren) {
          if ($isImageNode(child)) {
            const alt = child.__altText || "";
            const src = child.__src;
            parts.push(`![${alt}](${src})`);
          } else {
            // Get the markdown for this node by temporarily isolating it.
            // Since $convertToMarkdownString works on the whole tree, we
            // extract the text representation for non-image nodes by
            // checking their serialized text content with formatting.
            const nodeText = child.getTextContent();
            if (nodeText.trim()) {
              // Re-use the full markdown but only take the portion matching
              // this node — simplest reliable approach: serialize the whole
              // tree and split on image placeholders we inject.
            }
            // Fallback: just use the text content for non-image nodes
            parts.push(nodeText);
          }
        }

        // Better approach: serialize full tree, then re-insert image lines
        // at the correct positions by comparing child order.
        const rawMd = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
        const rawLines = rawMd.split("\n");
        const result: string[] = [];
        let rawIdx = 0;

        for (const child of rootChildren) {
          if ($isImageNode(child)) {
            result.push(`![${child.__altText || ""}](${child.__src})`);
          } else {
            // Consume lines from rawMd that correspond to this node
            const text = child.getTextContent().trim();
            if (!text) {
              // blank / empty paragraph — consume one blank line if present
              if (rawLines[rawIdx] === "") rawIdx++;
              result.push("");
              continue;
            }
            const nodeLines: string[] = [];
            while (rawIdx < rawLines.length) {
              const line = rawLines[rawIdx];
              nodeLines.push(line);
              rawIdx++;
              // A blank line signals end of a block
              if (line === "") break;
            }
            result.push(nodeLines.join("\n").trimEnd());
          }
        }

        markdown = result
          .filter((p) => p !== undefined)
          .join("\n\n")
          .replace(/\n{3,}/g, "\n\n");
      }

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
      <RequestEditContext.Provider value={onRequestEdit}>
        <LexicalComposer initialConfig={initialConfig}>
          <MarkdownUpdatePlugin
            markdown={markdownOutput}
            shouldUpdate={shouldUpdateEditor}
            onUpdateComplete={() => setShouldUpdateEditor(false)}
          />
          <div
            className={cn(
              "border rounded-md relative min-h-[200px] bg-card text-foreground flex flex-col",
              readOnly || bare ? "border-none bg-transparent" : "border-border",
            )}
          >
            {!readOnly && toolbar && <ToolbarPlugin className={toolbarClass} />}
            <div className="relative grow">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={cn(
                      "prose lg:prose-lg prose-app max-w-prose min-h-[150px] outline-none",
                      readOnly || bare ? "p-0" : "p-6",
                      readOnly && "cursor-default",
                    )}
                  />
                }
                placeholder={
                  !readOnly ? (
                    <div
                      className={cn(
                        "text-muted-foreground absolute pointer-events-none select-none text-sm",
                        bare ? "top-0 left-0" : "top-6 left-6",
                      )}
                    >
                      Type here (Markdown supported)…
                    </div>
                  ) : null
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin
                attributes={{ target: "_blank", rel: "noopener noreferrer" }}
              />
              <TablePlugin hasHorizontalScroll />
              <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
              {!readOnly && <NewTabLinkPlugin />}
              {readOnly && <ReadOnlyLinkClickPlugin />}
              {!readOnly && <OnChangePlugin onChange={handleChange} />}
              {!readOnly && plugins}
            </div>
          </div>
        </LexicalComposer>
      </RequestEditContext.Provider>

      {showDebug && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-inset text-foreground p-4 rounded-md overflow-x-auto">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
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
          <div className="bg-surface-inset border rounded-md p-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
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
