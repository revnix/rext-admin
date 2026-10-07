"use client";

import { $createHorizontalRuleNode } from "@lexical/extension";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
  type TextNode,
} from "lexical";
import {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Quote,
  Table,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type Block, type BlockId, matchBlocks } from "@/lib/editor/blocks";
import { cn } from "@/lib/utils";

const ICONS: Record<BlockId, LucideIcon> = {
  h2: Heading2,
  h3: Heading3,
  bulleted: List,
  numbered: ListOrdered,
  quote: Quote,
  table: Table,
  divider: Minus,
};

/** What each block does where the cursor is. Runs inside an editor update. */
export function insertBlock(editor: LexicalEditor, id: BlockId) {
  const selection = $getSelection();
  switch (id) {
    case "h2":
    case "h3":
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(id));
      }
      return;
    case "quote":
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
      return;
    case "bulleted":
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    case "numbered":
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    case "table":
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: "3",
        columns: "3",
        // A header row only, as the toolbar's own table and the Markdown round trip have it.
        includeHeaders: { rows: true, columns: false },
      });
      return;
    case "divider": {
      // Put in directly: nothing in this editor answers Lexical's "insert a rule" command.
      if (!$isRangeSelection(selection)) return;
      const line = selection.anchor.getNode().getTopLevelElement();
      if (!line) return;
      const rule = $createHorizontalRuleNode();
      if (line.isEmpty()) {
        // The empty line stays under the rule, to type on.
        line.insertBefore(rule);
        return;
      }
      line.insertAfter(rule);
      if (rule.getNextSibling() === null) {
        rule.insertAfter($createParagraphNode());
      }
      rule.selectNext();
      return;
    }
  }
}

class BlockOption extends MenuOption {
  block: Block;
  constructor(block: Block) {
    super(block.id);
    this.block = block;
  }
}

/**
 * The "/" menu (task 706): type "/" on a line for the blocks, keep typing to narrow them, Enter or a
 * click to insert one. Lexical's own typeahead handles the keys and where the menu sits.
 */
export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const triggerFn = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });
  const options = useMemo(
    () => matchBlocks(query).map((block) => new BlockOption(block)),
    [query],
  );

  const onSelectOption = useCallback(
    (option: BlockOption, typed: TextNode | null, closeMenu: () => void) => {
      editor.update(() => {
        // The "/" and what followed it were a command, not text.
        typed?.remove();
        insertBlock(editor, option.block.id);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<BlockOption>
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(
        anchor,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchor.current && options.length > 0
          ? createPortal(
              <div className="not-prose z-50 mt-6 w-60 rounded-md border bg-popover p-1 text-popover-foreground shadow-overlay">
                <p className="px-2 py-1 text-caption text-muted-foreground">
                  Add a block
                </p>
                {/* Lexical's typeahead keeps the focus in the text and moves through the options
                    by aria-selected, so the options take clicks only. */}
                <div role="listbox" aria-label="Blocks">
                  {options.map((option, index) => {
                    const Icon = ICONS[option.block.id];
                    return (
                      <div
                        key={option.key}
                        ref={option.setRefElement}
                        role="option"
                        aria-selected={selectedIndex === index}
                        tabIndex={-1}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(event) => {
                          // Before the text loses its selection.
                          event.preventDefault();
                          setHighlightedIndex(index);
                          selectOptionAndCleanUp(option);
                        }}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body",
                          selectedIndex === index && "bg-muted",
                        )}
                      >
                        <Icon size={16} aria-hidden />
                        {option.block.title}
                      </div>
                    );
                  })}
                </div>
              </div>,
              anchor.current,
            )
          : null
      }
    />
  );
}
