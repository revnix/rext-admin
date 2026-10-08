/**
 * Which elements may show their text in a session recording (rext-control task 712, step E).
 *
 * A recording hides every text unless the element it sits in is marked `data-rec="show"`. The mark
 * is a promise that the element's content is fixed text, written in the source: a button's
 * "Save", a table header's "Status". This file reads a source file with the TypeScript parser and
 * says, for each button, menu item, label and table header in it, whether that promise holds. The
 * test (`__tests__/lib/recording-marks.test.ts`) fails when a mark sits where it doesn't, and
 * `scripts/mark-recordable.mjs` adds the marks that can be proven. An element nobody marked, or
 * one that holds a value, is hidden: forgetting a mark hides one of the app's own words, never
 * shows a person's.
 *
 * `data-rec="own"` is a second, asserted mark for a label that comes from a list in the code (the
 * navigation's entries, a table's column headers), where one file can't prove it. It is allowed
 * only at the render sites the test names.
 */

type Compiler = typeof import("typescript");
type Node = import("typescript").Node;
type SourceFile = import("typescript").SourceFile;
type JsxChild = import("typescript").JsxChild;
type Expression = import("typescript").Expression;
type JsxAttributes = import("typescript").JsxAttributes;

/** The attribute, and what it may say. */
export const MARK = "data-rec";

/** The kinds a recording may show text on: buttons, menus, labels and table headers. */
export const SHOWN_KINDS: ReadonlySet<string> = new Set([
  // Buttons
  "Button",
  "button",
  "summary",
  // Menus: their items, a select's options, tabs, the sidebar's and the breadcrumb's entries
  "DropdownMenuItem",
  "DropdownMenuLabel",
  "DropdownMenuCheckboxItem",
  "DropdownMenuRadioItem",
  "DropdownMenuSubTrigger",
  "SelectItem",
  "option",
  "CommandItem",
  "TabsTrigger",
  "SidebarMenuButton",
  "SidebarMenuSubButton",
  "SidebarGroupLabel",
  "BreadcrumbLink",
  "BreadcrumbPage",
  // Labels
  "Label",
  "FieldLabel",
  "FieldLegend",
  "FormLabel",
  "label",
  "legend",
  // Table headers
  "TableHead",
  "th",
]);

// Components that add nothing of their own around their children.
const PLAIN_WRAPPERS = new Set(["Link", "Slot"]);
// What a person can read, or have read to them, besides the text itself.
const READABLE_ATTRIBUTES = new Set([
  "title",
  "alt",
  "placeholder",
  "aria-label",
  "aria-description",
  "aria-valuetext",
  "aria-roledescription",
  "aria-placeholder",
]);

/** One element of a shown kind, with content, as the source has it. */
export interface RecordableElement {
  kind: string;
  /** What `data-rec` says on it, or null when it isn't set (or isn't a plain string). */
  mark: string | null;
  /** Null when the content is fixed text; otherwise the first thing in it that isn't. */
  notFixed: string | null;
  /** The component or function it stands in ("NavRow"), or "" at the top of the file. */
  within: string;
  /** Which of that component's elements of this kind it is, counted from 1 in reading order. */
  nth: number;
  /** 1-based, for a message. */
  line: number;
  /** Where ` data-rec="show"` goes: just after the tag's name. */
  insertAt: number;
}

/** The names this file imports from lucide-react: an icon draws a picture and says nothing. */
function iconNames(ts: Compiler, file: SourceFile): Set<string> {
  const names = new Set<string>();
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "lucide-react"
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) names.add(element.name.text);
    }
  }
  return names;
}

/** Reads one file. */
export function recordableElements(
  ts: Compiler,
  fileName: string,
  source: string,
): RecordableElement[] {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const icons = iconNames(ts, file);

  /** A readable attribute must be written out too; `dangerouslySetInnerHTML` is never fixed. */
  const attributesNotFixed = (attributes: JsxAttributes): string | null => {
    for (const attribute of attributes.properties) {
      // `{...props}` can bring a title, a label, HTML or the content itself.
      if (!ts.isJsxAttribute(attribute))
        return "attributes spread from a value";
      const name = attribute.name.getText(file);
      if (name === "dangerouslySetInnerHTML") return "HTML set from a value";
      // `children={…}` is the content, written another way.
      if (name === "children") {
        const content = attribute.initializer;
        if (!content || ts.isStringLiteral(content)) continue;
        const reason =
          ts.isJsxExpression(content) && content.expression
            ? expressionNotFixed(content.expression)
            : childNotFixed(content as JsxChild);
        if (reason) return reason;
        continue;
      }
      if (!READABLE_ATTRIBUTES.has(name)) continue;
      const value = attribute.initializer;
      if (!value || ts.isStringLiteral(value)) continue;
      if (
        ts.isJsxExpression(value) &&
        value.expression &&
        !expressionNotFixed(value.expression)
      ) {
        continue;
      }
      return `${name} from a value`;
    }
    return null;
  };

  const expressionNotFixed = (expression: Expression): string | null => {
    if (
      ts.isStringLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression) ||
      ts.isNumericLiteral(expression) ||
      expression.kind === ts.SyntaxKind.NullKeyword ||
      expression.kind === ts.SyntaxKind.TrueKeyword ||
      expression.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return null;
    }
    if (ts.isParenthesizedExpression(expression)) {
      return expressionNotFixed(expression.expression);
    }
    // `saving ? "Saving…" : "Save"`: whichever it is, it is written here.
    if (ts.isConditionalExpression(expression)) {
      return (
        expressionNotFixed(expression.whenTrue) ??
        expressionNotFixed(expression.whenFalse)
      );
    }
    if (ts.isBinaryExpression(expression)) {
      const operator = expression.operatorToken.kind;
      // `open && <X />` shows the right side, or the left when the left is falsy. The only
      // falsy values React writes out are the numbers 0 and NaN (false, null, undefined and ""
      // write nothing), so the left side can add a "0" and never a person's text.
      if (operator === ts.SyntaxKind.AmpersandAmpersandToken) {
        return expressionNotFixed(expression.right);
      }
      // `name || "Untitled"` can show the left side.
      if (
        operator === ts.SyntaxKind.BarBarToken ||
        operator === ts.SyntaxKind.QuestionQuestionToken
      ) {
        return (
          expressionNotFixed(expression.left) ??
          expressionNotFixed(expression.right)
        );
      }
      return "a computed value";
    }
    if (
      ts.isJsxElement(expression) ||
      ts.isJsxSelfClosingElement(expression) ||
      ts.isJsxFragment(expression)
    ) {
      return childNotFixed(expression);
    }
    if (ts.isTemplateExpression(expression)) return "a text built from a value";
    if (ts.isCallExpression(expression)) return "a call";
    return "a value";
  };

  const childrenNotFixed = (children: readonly JsxChild[]): string | null => {
    for (const child of children) {
      const reason = childNotFixed(child);
      if (reason) return reason;
    }
    return null;
  };

  const childNotFixed = (child: JsxChild): string | null => {
    if (ts.isJsxText(child)) return null;
    if (ts.isJsxExpression(child)) {
      // `{...items}` spreads values in.
      if (child.dotDotDotToken) return "a value";
      return child.expression ? expressionNotFixed(child.expression) : null;
    }
    if (ts.isJsxFragment(child)) return childrenNotFixed(child.children);
    const opening = ts.isJsxElement(child) ? child.openingElement : child;
    const name = opening.tagName.getText(file);
    const plainTag = /^[a-z]/.test(name);
    if (
      !plainTag &&
      !icons.has(name) &&
      !PLAIN_WRAPPERS.has(name) &&
      !SHOWN_KINDS.has(name)
    ) {
      return `a component (${name})`;
    }
    const attributes = attributesNotFixed(opening.attributes);
    if (attributes) return attributes;
    return ts.isJsxElement(child) ? childrenNotFixed(child.children) : null;
  };

  /** The nearest named function, method or `const X = …` around a node. */
  const withinOf = (node: Node): string => {
    for (let at: Node | undefined = node.parent; at; at = at.parent) {
      if (
        (ts.isFunctionDeclaration(at) || ts.isMethodDeclaration(at)) &&
        at.name
      ) {
        return at.name.getText(file);
      }
      if (ts.isVariableDeclaration(at) && ts.isIdentifier(at.name)) {
        return at.name.text;
      }
    }
    return "";
  };

  const found: RecordableElement[] = [];
  // Every element counts, marked or not: the second button of a component stays the second.
  const seen = new Map<string, number>();
  const visit = (node: Node): void => {
    // `<Button … />` holds no text, but a mark on it still promises its attributes.
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null;
    if (opening) {
      const kind = opening.tagName.getText(file);
      const within = withinOf(node);
      const nth = (seen.get(`${within}>${kind}`) ?? 0) + 1;
      seen.set(`${within}>${kind}`, nth);
      let mark: string | null = null;
      let marked = false;
      for (const attribute of opening.attributes.properties) {
        if (
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(file) === MARK
        ) {
          marked = true;
          const value = attribute.initializer;
          mark = value && ts.isStringLiteral(value) ? value.text : null;
        }
      }
      // An unmarked element is listed only when it has content to show.
      if (marked || (SHOWN_KINDS.has(kind) && ts.isJsxElement(node))) {
        found.push({
          kind,
          mark: marked ? (mark ?? "(not a plain string)") : null,
          notFixed:
            attributesNotFixed(opening.attributes) ??
            (ts.isJsxElement(node) ? childrenNotFixed(node.children) : null),
          within,
          nth,
          line:
            file.getLineAndCharacterOfPosition(opening.getStart(file)).line + 1,
          insertAt: opening.tagName.getEnd(),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/**
 * What is wrong with the marks in one file, as messages; empty when nothing is. `ownSites` is
 * the exact list of this file's elements allowed to carry `data-rec="own"`, each as the
 * component it stands in, its kind and which of that component's elements of the kind it is
 * ("SettingsRow > SidebarMenuButton #2"), in the order they stand in the file. One more, one
 * fewer, another kind, or the mark moved to another element is a problem, so an asserted mark
 * can't be added or moved without the list (and its reader) changing.
 */
export function markProblems(
  ts: Compiler,
  fileName: string,
  source: string,
  ownSites: readonly string[] = [],
): string[] {
  const problems: string[] = [];
  const owned: string[] = [];
  for (const element of recordableElements(ts, fileName, source)) {
    const where = `${fileName}:${element.line} <${element.kind}>`;
    if (element.mark === "show") {
      if (!SHOWN_KINDS.has(element.kind)) {
        problems.push(
          `${where}: data-rec="show" is for buttons, menu items, labels and table headers`,
        );
      } else if (element.notFixed) {
        problems.push(
          `${where}: data-rec="show" promises fixed text, and this holds ${element.notFixed}`,
        );
      }
    } else if (element.mark === "own") {
      owned.push(`${element.within} > ${element.kind} #${element.nth}`);
      if (!SHOWN_KINDS.has(element.kind)) {
        problems.push(
          `${where}: data-rec="own" is for buttons, menu items, labels and table headers`,
        );
      }
    } else if (
      element.mark !== null &&
      element.mark !== "mask" &&
      element.mark !== "block"
    ) {
      problems.push(
        `${where}: data-rec is "show", "own", "mask" or "block", written as a plain string`,
      );
    }
  }
  if (owned.join(", ") !== ownSites.join(", ")) {
    problems.push(
      `${fileName}: data-rec="own" is allowed only at the render sites the test names (here: ${
        ownSites.join(", ") || "none"
      }; found: ${owned.join(", ") || "none"})`,
    );
  }
  return problems;
}

/**
 * The source with `data-rec="show"` added to every unmarked element whose content is fixed text,
 * and taken off any element where that promise doesn't hold (any more).
 */
export function markFixedText(
  ts: Compiler,
  fileName: string,
  source: string,
): { source: string; added: number; removed: number } {
  // Taken off first, by text: the places below are read again from what is left.
  let removed = 0;
  let current = source;
  for (;;) {
    const broken = recordableElements(ts, fileName, current).find(
      (element) =>
        element.mark === "show" &&
        (element.notFixed !== null || !SHOWN_KINDS.has(element.kind)),
    );
    if (!broken) break;
    const after = current.slice(broken.insertAt);
    const mark = after.match(/^([^>]*?)\s+data-rec="show"/);
    if (!mark) break;
    current =
      current.slice(0, broken.insertAt) + mark[1] + after.slice(mark[0].length);
    removed += 1;
  }
  const places = recordableElements(ts, fileName, current)
    .filter(
      (element) =>
        element.mark === null &&
        element.notFixed === null &&
        SHOWN_KINDS.has(element.kind),
    )
    .map((element) => element.insertAt)
    .sort((a, b) => b - a);
  for (const at of places) {
    current = `${current.slice(0, at)} ${MARK}="show"${current.slice(at)}`;
  }
  return { source: current, added: places.length, removed };
}
