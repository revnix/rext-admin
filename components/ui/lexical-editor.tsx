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
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  $createParagraphNode,
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
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for class matching
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Define a theme that maps Lexical nodes to Tailwind classes
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

// Nodes required for markdown support
const NODES = [
  HeadingNode,
  QuoteNode,
  CodeNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState("");
  const [blockType, setBlockType] = useState("paragraph");

  // History State
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Popover input state
  const [tempLinkUrl, setTempLinkUrl] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Check for Link
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
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Register commands for history
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
      (_payload) => {
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
    if (tempLinkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, tempLinkUrl);
      setIsPopoverOpen(false);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      setIsPopoverOpen(false);
    }
  }, [editor, tempLinkUrl]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setIsPopoverOpen(false);
  }, [editor]);

  const handleLinkUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempLinkUrl(e.target.value);
  };

  const onPopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setTempLinkUrl(currentLinkUrl);
    }
  };

  return (
    <div className="flex items-center gap-1 border-b border-border p-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex-wrap">
      <ToolbarButton
        active={false}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

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

      <div className="w-px h-6 bg-gray-200 mx-1" />

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

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <ToolbarButton
        active={isBold}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        title="Bold"
      >
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        title="Italic"
      >
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        title="Underline"
      >
        <Underline size={18} />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </ToolbarButton>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <ToolbarButton
        active={isCode}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }}
        title="Inline Code"
      >
        <CodeIcon size={18} />
      </ToolbarButton>

      <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "p-2 rounded hover:bg-gray-100 transition-colors",
              isLink || isPopoverOpen
                ? "bg-gray-200 text-black"
                : "text-gray-600",
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
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  defaultValue={currentLinkUrl}
                  value={tempLinkUrl}
                  onChange={handleLinkUrlChange}
                  className="col-span-2 h-8"
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
    </div>
  );
}

interface LexicalEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  showDebug?: boolean;
}

import { Textarea } from "@/components/ui/textarea";

// Plugin to update editor when markdown input changes
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
        $convertFromMarkdownString(markdown, TRANSFORMERS);
      });
      onUpdateComplete();
    }
  }, [shouldUpdate, markdown, editor, onUpdateComplete]);

  return null;
}

export default function LexicalEditor({
  initialValue = "",
  onChange,
  readOnly = false,
  showDebug = false,
}: LexicalEditorProps) {
  const [markdownOutput, setMarkdownOutput] = useState(initialValue);
  const [shouldUpdateEditor, setShouldUpdateEditor] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: markdownOutput excluded to avoid resetting user input when typing
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== markdownOutput) {
      setMarkdownOutput(initialValue);
      setShouldUpdateEditor(true);
    }
  }, [initialValue]);

  // We use useMemo to ensure the initialConfig is stable.
  // biome-ignore lint/correctness/useExhaustiveDependencies: initialValue excluded to prevent re-creating editor state
  const initialConfig = useMemo(
    () => ({
      namespace: "my-editor",
      theme,
      nodes: NODES,
      readOnly: readOnly,
      onError: (error: Error) => {
        // biome-ignore lint/suspicious/noConsole: Lexical editor error handler
        console.error(error);
      },
      editorState: () => {
        // Convert initial markdown to editor state
        if (initialValue) {
          try {
            $convertFromMarkdownString(initialValue, TRANSFORMERS);
          } catch (_e) {}
        }
      },
    }),
    [readOnly],
  );

  function handleChange(editorState: unknown) {
    (editorState as { read: (fn: () => void) => void }).read(() => {
      // Export to markdown
      const markdown = $convertToMarkdownString(TRANSFORMERS);

      // Only update local state if we aren't currently forcing an update
      // (though normally forcing happens before this callback)
      if (!shouldUpdateEditor) {
        setMarkdownOutput(markdown);
      }

      if (onChange) {
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
            "border rounded-md relative min-h-[200px] bg-background text-foreground overflow-hidden flex flex-col",
            readOnly
              ? "border-none shadow-none bg-transparent"
              : "border-border shadow-sm",
          )}
        >
          {!readOnly && <ToolbarPlugin />}
          <div className="relative flex-grow">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    "min-h-[150px] outline-none p-4",
                    readOnly ? "p-0" : "p-6",
                  )}
                />
              }
              placeholder={
                !readOnly ? (
                  <div className="text-gray-400 absolute top-4 left-4 pointer-events-none select-none">
                    Type here (Markdown supported)...
                  </div>
                ) : null
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
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
