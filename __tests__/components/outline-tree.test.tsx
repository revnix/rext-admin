import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { OutlineReview } from "@/components/generate-content/outline-review";
import type { OutlineApproval } from "@/lib/generate-content/outline-review";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { Outline } from "@/types/generate-content";

// The outline step's tree (rext-control#696, option A): the keyboard model, inline rename, the
// row menu as the fallback for every action, focus after an edit, what the live region says,
// and what approval sends after each kind of edit.

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ data: { personas: [] } }),
}));
jest.mock("sonner", () => ({ toast: jest.fn() }));

beforeEach(() => {
  (toast as unknown as jest.Mock).mockClear();
  act(() =>
    useSubscriptionStore.setState({
      credits: null,
      fetchCredits: jest.fn().mockResolvedValue(undefined),
    }),
  );
});

const LIST = "structure.sections";
type Level = "H2" | "H3" | "H4";

// Why plan · Choosing the spot (Sun hours, Soil) · Planning beds (Bed sizes) · Timing.
const SECTIONS: [string, Level, number][] = [
  ["Why plan", "H2", 200],
  ["Choosing the spot", "H2", 300],
  ["Sun hours", "H3", 150],
  ["Soil", "H3", 200],
  ["Planning beds", "H2", 350],
  ["Bed sizes", "H3", 150],
  ["Timing", "H2", 400],
];

const gateOf = (sections: [string, Level | null, number][]) => ({
  type: "outline_review",
  section_additions: [LIST],
  editable_sections: sections.map(([heading, level], index) => ({
    id: `${LIST}:${index}`,
    list: LIST,
    heading,
    ...(level ? { heading_level: level } : {}),
  })),
});

const outlineOf = (
  sections: [string, Level | null, number][],
  extra: Record<string, unknown> = {},
) =>
  ({
    title: "Vegetable garden planner",
    brief: "Plan the beds, the timing and the crops.",
    tone: "Friendly",
    target_audience: ["Beginners"],
    target_word_count: 1800,
    keywords_to_include: [],
    status: "reviewing",
    sections: [],
    structure: {
      sections: sections.map(([heading, , words]) => ({
        heading,
        description: `What ${heading} covers.`,
        suggested_word_count: words,
        questions_to_answer: [],
        key_points: [`${heading} point`],
      })),
    },
    ...extra,
  }) as unknown as Outline;

function renderOutline({
  sections = SECTIONS as [string, Level | null, number][],
  extra = {} as Record<string, unknown>,
  gate = undefined as Record<string, unknown> | undefined,
  isLoading = false,
} = {}) {
  const onApprove = jest.fn<void, [OutlineApproval]>();
  render(
    <OutlineReview
      outline={outlineOf(sections, extra)}
      rawTokens=""
      isLoading={isLoading}
      gate={gate ?? gateOf(sections)}
      onApprove={onApprove}
      onReject={jest.fn()}
    />,
  );
  const user = userEvent.setup();
  const approve = async () => {
    await user.click(
      screen.getByRole("button", { name: /approve and generate/i }),
    );
    return onApprove.mock.calls.at(-1)?.[0] as OutlineApproval;
  };
  return { user, approve };
}

const grid = () => screen.getByRole("treegrid", { name: "Sections" });
const rowOf = (name: string) => within(grid()).getByRole("row", { name });
const headings = () =>
  Array.from(
    grid().querySelectorAll('[data-slot="outline-heading"]'),
    (heading) => heading.textContent,
  );
const focusRow = (name: string) => act(() => rowOf(name).focus());
/** The words are in the polite live region, for a screen reader. */
const expectSaid = (text: string) =>
  expect(screen.getByText(text).closest('[aria-live="polite"]')).not.toBeNull();
const sentIds = (approval: OutlineApproval) =>
  approval.sections?.map((edit) =>
    "id" in edit ? Number(edit.id.split(":")[1]) : edit.heading,
  );
const lastToast = () =>
  (toast as unknown as jest.Mock).mock.calls.at(-1) as [
    string,
    { action: { onClick: () => void } },
  ];

async function chooseFromMenu(
  user: ReturnType<typeof userEvent.setup>,
  rowHeading: string,
  item: string | RegExp,
) {
  await user.click(
    screen.getByRole("button", { name: `Actions for ${rowHeading}` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: item }));
}

describe("the outline in depth (FB3.4)", () => {
  it("shows every section's and sub-section's points from the start, nested by level", () => {
    renderOutline();

    for (const [heading, level] of SECTIONS) {
      // Under each heading, its own points: nothing waits behind a click.
      expect(screen.getByText(`${heading} point`)).toBeInTheDocument();
      expect(rowOf(heading)).toHaveAttribute(
        "aria-level",
        level === "H2" ? "1" : "2",
      );
      expect(screen.getByRole("button", { name: heading })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    }
  });

  it("folds one plan away with Left and brings it back with Right, leaving the others open", async () => {
    const { user } = renderOutline();

    await focusRow("Choosing the spot");
    await user.keyboard("{ArrowLeft}");
    expect(screen.queryByText("Choosing the spot point")).toBeNull();
    // Its sub-sections keep theirs, and so does every other section.
    expect(screen.getByText("Sun hours point")).toBeInTheDocument();
    expect(screen.getByText("Why plan point")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Choosing the spot point")).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.queryByText("Choosing the spot point")).toBeNull();
  });
});

describe("the outline as a document outline", () => {
  it("shows the title as its root, a tag per level, and the summary", () => {
    renderOutline();

    const section = screen.getByRole("region", { name: "Sections" });
    expect(within(section).getByText("H1")).toBeInTheDocument();
    expect(
      within(section).getByText("Vegetable garden planner"),
    ).toBeInTheDocument();
    expect(
      within(section).getByText("The title, from step 4"),
    ).toBeInTheDocument();
    expect(
      within(section).getByText("4 sections · 3 subsections · ~1,750 words"),
    ).toBeInTheDocument();
    // The tags are for the eye: the row says its level itself.
    const tag = within(rowOf("Soil")).getByText("H3");
    expect(tag).toHaveAttribute("aria-hidden", "true");
    expect(within(rowOf("Timing")).getByText("H2")).toBeInTheDocument();
  });

  /** "level position/size", as the row gives them to assistive technology. */
  const placeOf = (name: string) => {
    const row = rowOf(name);
    return `${row.getAttribute("aria-level")} ${row.getAttribute("aria-posinset")}/${row.getAttribute("aria-setsize")}`;
  };

  it("is a tree grid whose rows say their level and their place among their siblings", () => {
    renderOutline();

    // A section counts among the list's sections, a subsection among those of its section.
    expect(SECTIONS.map(([heading]) => placeOf(heading))).toEqual([
      "1 1/4",
      "1 2/4",
      "2 1/2",
      "2 2/2",
      "1 3/4",
      "2 1/1",
      "1 4/4",
    ]);
    expect(rowOf("Soil")).toHaveAccessibleDescription("~200 words");
  });

  it("keeps those places right after a move, while the announcement counts the whole list", async () => {
    const { user } = renderOutline();

    await focusRow("Bed sizes");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    // The third subsection of "Choosing the spot"; "Planning beds" has none left.
    expect(placeOf("Bed sizes")).toBe("2 3/3");
    expect(placeOf("Soil")).toBe("2 2/3");
    expect(placeOf("Planning beds")).toBe("1 3/4");
    expectSaid(
      "Moved Bed sizes to position 5 of 7, now a subsection of Choosing the spot.",
    );
  });

  it("shows an H4 with its tag and offers it no change of level", async () => {
    const pillar: [string, Level, number][] = [
      ["Soil", "H2", 300],
      ["Soil types", "H3", 200],
      ["Clay", "H4", 100],
      ["Watering", "H2", 300],
    ];
    const { user, approve } = renderOutline({ sections: pillar });

    const clay = rowOf("Clay");
    expect(clay).toHaveAttribute("aria-level", "3");
    expect(clay).toHaveAttribute("aria-posinset", "1");
    expect(clay).toHaveAttribute("aria-setsize", "1");
    expect(within(clay).getByText("H4")).toBeInTheDocument();

    await focusRow("Clay");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expectSaid("Clay is an H4; it keeps its level.");
    await user.click(screen.getByRole("button", { name: "Actions for Clay" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(
      screen.queryByRole("menuitem", { name: /^Make a/ }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("gives a list without levels no tags and no level actions", async () => {
    const steps: [string, null, number][] = [
      ["Mark the beds", null, 100],
      ["Dig", null, 100],
    ];
    const { user } = renderOutline({ sections: steps });

    expect(within(grid()).queryByText("H2")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actions for Dig" }));
    await screen.findByRole("menuitem", { name: "Move up" });
    expect(
      screen.queryByRole("menuitem", { name: /^Make a/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Add subsection" }),
    ).not.toBeInTheDocument();
  });

  it("lists the FAQ read-only when the outline has one, and not otherwise", () => {
    renderOutline({
      extra: {
        faqs: ["When should I start planning?", "How big should it be?"],
      },
    });

    const faq = screen.getByRole("region", { name: "FAQ" });
    expect(within(faq).getByText("2 questions")).toBeInTheDocument();
    expect(
      within(faq)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["1When should I start planning?", "2How big should it be?"]);
    expect(
      within(faq).getByText(
        "Answered at the end of the article. To change them, regenerate with feedback.",
      ),
    ).toBeInTheDocument();
    expect(within(faq).queryByRole("button")).not.toBeInTheDocument();
    expect(within(faq).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows no FAQ list for an outline without questions", () => {
    renderOutline();
    expect(
      screen.queryByRole("region", { name: "FAQ" }),
    ).not.toBeInTheDocument();
  });

  it("gives the keys under the list, and sizes for a finger on a phone", () => {
    renderOutline();

    expect(grid()).toHaveAccessibleDescription(
      /select.*rename.*move.*level.*remove.*more/,
    );
    const hints = screen.getByText("rename", { exact: false }).closest("p");
    // One line of hints, gone on a phone; the handle and the menu are 40 px there.
    expect(hints).toHaveClass("max-md:hidden");
    const row = rowOf("Soil");
    expect(row.querySelector(".cursor-grab")).toHaveClass(
      "max-lg:size-10",
      "touch-none",
    );
    expect(
      screen.getByRole("button", { name: "Actions for Soil" }),
    ).toHaveClass("max-lg:size-10");
  });

  it("gives way to the outline's shape while the outline is written again: nothing to edit", async () => {
    renderOutline({ isLoading: true });

    expect(screen.queryByRole("treegrid")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add section" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("The outline is being written."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve and generate/i }),
    ).toBeDisabled();
  });
});

describe("a page with several lists", () => {
  // A How-to's outline, as a real run sent it: two lists, neither with heading levels.
  const list = (name: string, headings: string[], level?: Level) =>
    headings.map((heading, index) => ({
      id: `${name}:${index}`,
      list: name,
      heading,
      ...(level ? { heading_level: level } : {}),
    }));
  const STEPS = list("steps", [
    "Measure the space",
    "Create a layout plan",
    "Mark the beds",
    "Dig",
    "Plant",
  ]);
  const TOOLS = list("tools", ["Spade", "String", "Tape measure"]);
  const gateWith = (...lists: ReturnType<typeof list>[]) => ({
    type: "outline_review",
    section_additions: ["steps"],
    editable_sections: lists.flat(),
  });
  const treeOf = (name: string) => screen.getByRole("treegrid", { name });
  /** The lines of keyboard hints on the page: each names "rename" once. */
  const hintLines = () =>
    screen
      .getAllByText("rename", { exact: false })
      .map((hint) => hint.closest("p"));

  it("counts a list without levels by its own name, not as sections", async () => {
    const { user } = renderOutline({ gate: gateWith(STEPS, TOOLS) });

    const steps = screen.getByRole("region", { name: "Steps" });
    const tools = screen.getByRole("region", { name: "Tools" });
    expect(within(steps).getByText("5 steps")).toBeInTheDocument();
    expect(within(tools).getByText("3 tools")).toBeInTheDocument();
    expect(screen.queryByText(/\bsections?\b ·|^\d+ sections?$/)).toBe(null);

    // The count follows an edit, down to one.
    await act(() =>
      within(treeOf("Tools")).getByRole("row", { name: "String" }).focus(),
    );
    await user.keyboard("{Delete}{Delete}");
    expect(within(tools).getByText("1 tool")).toBeInTheDocument();
  });

  it("calls what is added by the list's own name: a step, not a section", async () => {
    const { user } = renderOutline({ gate: gateWith(STEPS, TOOLS) });
    const steps = screen.getByRole("region", { name: "Steps" });

    expect(screen.queryByRole("button", { name: "Add section" })).toBeNull();
    await user.click(within(steps).getByRole("button", { name: "Add step" }));
    const field = within(steps).getByRole("textbox", { name: "New step" });
    expect(field).toHaveAttribute("placeholder", "The new step");
    await user.type(field, "Water{Enter}");

    expect(within(steps).getByText("6 steps")).toBeInTheDocument();
    expect(steps).toHaveTextContent("1 of 6 new steps");
    expect(steps).not.toHaveTextContent(/new sections/);
  });

  it("names the keys once, under the last list, with no level key where no list has levels", () => {
    renderOutline({ gate: gateWith(STEPS, TOOLS) });

    const lines = hintLines();
    expect(lines).toHaveLength(1);
    // Under the last list, and every list's tree grid is described by it.
    expect(screen.getByRole("region", { name: "Tools" })).toContainElement(
      lines[0],
    );
    expect(screen.getByRole("region", { name: "Steps" })).not.toContainElement(
      lines[0],
    );
    for (const name of ["Steps", "Tools"]) {
      expect(treeOf(name)).toHaveAccessibleDescription(
        /select.*rename.*move.*remove.*more/,
      );
      expect(treeOf(name)).not.toHaveAccessibleDescription(/level/);
    }
    expect(lines[0]).not.toHaveTextContent("level");
  });

  it("offers a row without a level no change of level in its menu, though the key answers", async () => {
    const { user, approve } = renderOutline({ gate: gateWith(STEPS, TOOLS) });

    await user.click(
      screen.getByRole("button", { name: "Actions for Create a layout plan" }),
    );
    const menu = await screen.findByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual([
      "RenameEnter",
      "Move upAlt+↑",
      "Move downAlt+↓",
      "Add step below",
      "RemoveDelete",
    ]);
    await user.keyboard("{Escape}");

    const row = within(treeOf("Steps")).getByRole("row", {
      name: "Create a layout plan",
    });
    await waitFor(() => expect(row).toHaveFocus());
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expectSaid("Create a layout plan has no heading level to change.");
    // Moving a step still works, and is sent.
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expectSaid(
      "Moved Create a layout plan to position 3 of 5, after Mark the beds.",
    );
    expect(
      (await approve()).sections?.map((edit) => ("id" in edit ? edit.id : "")),
    ).toEqual([
      "steps:0",
      "steps:2",
      "steps:1",
      "steps:3",
      "steps:4",
      "tools:0",
      "tools:1",
      "tools:2",
    ]);
  });

  it("names the level key in the one line when a list on the page has levels", () => {
    renderOutline({
      gate: gateWith(
        [
          ...list("sections", ["Why plan"], "H2"),
          ...list("sections", ["Sun hours"], "H3").map((row) => ({
            ...row,
            id: "sections:1",
          })),
        ],
        TOOLS,
      ),
    });

    const lines = hintLines();
    expect(lines).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Tools" })).toContainElement(
      lines[0],
    );
    expect(lines[0]).toHaveTextContent("level");
    expect(
      within(screen.getByRole("region", { name: "Sections" })).getByText(
        "1 section · 1 subsection",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Tools" })).getByText(
        "3 tools",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the line under a single list, with the level key for a list with levels", () => {
    renderOutline();

    const lines = hintLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveTextContent("level");
    expect(screen.getByRole("region", { name: "Sections" })).toContainElement(
      lines[0],
    );
  });
});

describe("the outline's keyboard", () => {
  it("is one stop in the Tab order, with ↑ ↓ Home End between sections", async () => {
    const { user } = renderOutline();

    // Only the first row takes Tab; nothing inside a row does.
    expect(rowOf("Why plan")).toHaveAttribute("tabindex", "0");
    expect(rowOf("Soil")).toHaveAttribute("tabindex", "-1");
    for (const control of within(grid()).getAllByRole("button"))
      expect(control).toHaveAttribute("tabindex", "-1");
    // The handle is for a pointer: no role, no Tab stop, hidden from assistive technology.
    const handle = rowOf("Soil").querySelector(".cursor-grab");
    expect(handle).toHaveAttribute("aria-hidden", "true");
    expect(handle).not.toHaveAttribute("tabindex");

    await focusRow("Why plan");
    await user.keyboard("{ArrowDown}");
    expect(rowOf("Choosing the spot")).toHaveFocus();
    expect(rowOf("Choosing the spot")).toHaveAttribute("tabindex", "0");
    expect(rowOf("Why plan")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{End}");
    expect(rowOf("Timing")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(rowOf("Timing")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(rowOf("Bed sizes")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(rowOf("Why plan")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(rowOf("Why plan")).toHaveFocus();
  });

  it("moves a section with its subsections on Alt+↓, keeps focus on it and says where it went", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Choosing the spot");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(headings()).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Timing",
    ]);
    expect(rowOf("Choosing the spot")).toHaveFocus();
    expectSaid(
      "Moved Choosing the spot and its 2 subsections to position 4 of 7, after Bed sizes.",
    );
    expect(sentIds(await approve())).toEqual([0, 4, 5, 1, 2, 3, 6]);
  });

  it("moves it back on Alt+↑, and approval then sends no sections", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Planning beds");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(headings().slice(0, 3)).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
    ]);
    expectSaid(
      "Moved Planning beds and its subsection to position 2 of 7, after Why plan.",
    );
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(headings()).toEqual(SECTIONS.map(([heading]) => heading));
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("takes a first subsection into the section above on Alt+↑, and says so", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Bed sizes");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(headings().slice(3, 6)).toEqual([
      "Soil",
      "Bed sizes",
      "Planning beds",
    ]);
    expect(rowOf("Bed sizes")).toHaveFocus();
    expectSaid(
      "Moved Bed sizes to position 5 of 7, now a subsection of Choosing the spot.",
    );
    expect(sentIds(await approve())).toEqual([0, 1, 2, 3, 5, 4, 6]);
  });

  it("says so when a section can't move further", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Why plan");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expectSaid("Why plan can't move up.");
    await focusRow("Timing");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expectSaid("Timing can't move down.");
    // The first section's first subsection has no section above to join.
    await focusRow("Choosing the spot");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await focusRow("Sun hours");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expectSaid("Sun hours can't move up.");
    expect(headings()[0]).toBe("Choosing the spot");
    expect(sentIds(await approve())).toEqual([1, 2, 3, 0, 4, 5, 6]);
  });

  it("makes a section a subsection on Alt+→, sent though nothing else changed", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Planning beds");
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");

    expect(rowOf("Planning beds")).toHaveAttribute("aria-level", "2");
    expect(within(rowOf("Planning beds")).getByText("H3")).toBeInTheDocument();
    expect(rowOf("Planning beds")).toHaveFocus();
    expectSaid("Planning beds is now a subsection of Choosing the spot.");
    const approval = await approve();
    expect(sentIds(approval)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(approval.sections?.[4]).toEqual({
      id: `${LIST}:4`,
      heading: "Planning beds",
      heading_level: "H3",
    });
  });

  it("makes a subsection a section on Alt+←, and back again leaves nothing to send", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Sun hours");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(rowOf("Sun hours")).toHaveAttribute("aria-level", "1");
    expectSaid("Sun hours is now a section, with its subsection.");
    expect((await approve()).sections?.[2]).toEqual({
      id: `${LIST}:2`,
      heading: "Sun hours",
      heading_level: "H2",
    });

    await focusRow("Sun hours");
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expectSaid("Sun hours is now a subsection of Choosing the spot.");
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("keeps the first section a section, and says why", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Why plan");
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expectSaid("Why plan can't be a subsection: it's the first section.");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expectSaid("Why plan is already a section.");
    expect(rowOf("Why plan")).toHaveAttribute("aria-level", "1");
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("removes a section with its subsections on Delete, moves focus to the next, and Undo brings it back", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Choosing the spot");
    await user.keyboard("{Delete}");

    expect(headings()).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
      "Timing",
    ]);
    expect(rowOf("Planning beds")).toHaveFocus();
    expectSaid(
      "Removed Choosing the spot and its 2 subsections. Undo is in the notification.",
    );
    const [message, options] = lastToast();
    expect(message).toBe('Removed "Choosing the spot" and its 2 subsections');
    expect(
      screen.getByText("3 sections · 1 subsection · ~1,100 words"),
    ).toBeInTheDocument();
    expect(sentIds(await approve())).toEqual([0, 4, 5, 6]);

    act(() => options.action.onClick());
    expect(headings()).toEqual(SECTIONS.map(([heading]) => heading));
    expectSaid("Restored Choosing the spot and its 2 subsections.");
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("removes on Backspace too, and gives focus to the row before when it was the last", async () => {
    const { user } = renderOutline();

    await focusRow("Timing");
    await user.keyboard("{Backspace}");

    expect(headings().at(-1)).toBe("Bed sizes");
    expect(rowOf("Bed sizes")).toHaveFocus();
    expectSaid("Removed Timing. Undo is in the notification.");
  });

  it("keeps a list's last section, and says why", async () => {
    const { user } = renderOutline({
      sections: [
        ["Soil", "H2", 300],
        ["Soil types", "H3", 200],
      ],
    });

    await focusRow("Soil");
    await user.keyboard("{Delete}");
    expect(headings()).toEqual(["Soil", "Soil types"]);
    expectSaid(
      "Soil can't be removed: an article keeps at least one section here.",
    );
    expect(toast).not.toHaveBeenCalled();
  });

  it("unfolds a section's plan with →, folds it with ←, and toggles it with Space or a click", async () => {
    const { user } = renderOutline();
    const plan = () => screen.queryByText("What Soil covers.");

    await focusRow("Soil");
    await user.keyboard("{ArrowRight}");
    expect(plan()).toBeInTheDocument();
    expect(screen.getByText("Soil point")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(plan()).not.toBeInTheDocument();
    await user.keyboard(" ");
    expect(plan()).toBeInTheDocument();
    expect(rowOf("Soil")).toHaveFocus();

    const toggle = screen.getByRole("button", { name: "Soil" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(plan()).not.toBeInTheDocument();
    // A click leaves focus on the row, so the keys carry on from it.
    expect(rowOf("Soil")).toHaveFocus();
  });
});

describe("a pillar outline's H4s, from the keyboard", () => {
  // Soil (Soil types (Clay, Sand), Drainage (Gravel)) · Watering.
  const DEEP: [string, Level, number][] = [
    ["Soil", "H2", 300],
    ["Soil types", "H3", 200],
    ["Clay", "H4", 100],
    ["Sand", "H4", 100],
    ["Drainage", "H3", 200],
    ["Gravel", "H4", 100],
    ["Watering", "H2", 300],
  ];
  const levelsShown = () =>
    DEEP.map(([heading]) => rowOf(heading).getAttribute("aria-level"));
  const sentLevels = (approval: OutlineApproval) =>
    approval.sections?.map((edit) => edit.heading_level);

  it("keeps an H4 under a subsection on Alt+↑ and Alt+↓, and says when it can't go further", async () => {
    const { user, approve } = renderOutline({ sections: DEEP });

    // The first H4 of the section's first subsection: above it is its H3, then the H2.
    await focusRow("Clay");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expectSaid("Clay can't move up.");
    expect(headings()).toEqual(DEEP.map(([heading]) => heading));

    // The first H4 of a later subsection goes to the end of the subsection before.
    await focusRow("Gravel");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(headings()).toEqual([
      "Soil",
      "Soil types",
      "Clay",
      "Sand",
      "Gravel",
      "Drainage",
      "Watering",
    ]);
    expect(rowOf("Gravel")).toHaveFocus();
    expect(rowOf("Gravel")).toHaveAttribute("aria-level", "3");
    expect(rowOf("Gravel")).toHaveAttribute("aria-posinset", "3");
    expectSaid(
      "Moved Gravel to position 5 of 7, now a subsection of Soil types.",
    );
    const moved = await approve();
    expect(sentIds(moved)).toEqual([0, 1, 2, 3, 5, 4, 6]);
    expect(moved.sections?.[4]).toEqual({
      id: `${LIST}:5`,
      heading: "Gravel",
      heading_level: "H4",
    });

    // Down again: into the subsection after, then no further, since "Watering" is an H2.
    await focusRow("Gravel");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(headings()).toEqual(DEEP.map(([heading]) => heading));
    expectSaid(
      "Moved Gravel to position 6 of 7, now a subsection of Drainage.",
    );
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expectSaid("Gravel can't move down.");
    expect(headings()).toEqual(DEEP.map(([heading]) => heading));
    expect(await approve()).not.toHaveProperty("sections");

    // The menu says the same: no Move up for the H4 that can't go up.
    await user.click(screen.getByRole("button", { name: "Actions for Clay" }));
    expect(
      await screen.findByRole("menuitem", { name: "Move up" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("menuitem", { name: "Move down" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("takes a subsection's H4s up a level with it on Alt+←, so none is left under an H2", async () => {
    const { user, approve } = renderOutline({ sections: DEEP });

    await focusRow("Soil types");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");

    // "Soil types" is a section; "Clay" and "Sand" are its subsections, and "Drainage" came along.
    expect(levelsShown()).toEqual(["1", "1", "2", "2", "2", "3", "1"]);
    expect(within(rowOf("Clay")).getByText("H3")).toBeInTheDocument();
    expect(within(rowOf("Sand")).getByText("H3")).toBeInTheDocument();
    expect(rowOf("Soil types")).toHaveFocus();
    expectSaid("Soil types is now a section, with its 4 subsections.");
    expect(sentLevels(await approve())).toEqual([
      "H2",
      "H2",
      "H3",
      "H3",
      "H3",
      "H4",
      "H2",
    ]);

    // Back to a subsection: its old H4s stay H3, beside it, and "Gravel" stays under "Drainage".
    await focusRow("Soil types");
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(levelsShown()).toEqual(["1", "2", "2", "2", "2", "3", "1"]);
    expectSaid("Soil types is now a subsection of Soil.");
    expect(sentLevels(await approve())).toEqual([
      "H2",
      "H3",
      "H3",
      "H3",
      "H3",
      "H4",
      "H2",
    ]);
  });
});

describe("renaming in place", () => {
  it("opens on Enter, saves on Enter, and gives focus back to the row", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Soil");
    await user.keyboard("{Enter}");
    const field = screen.getByRole("textbox", { name: "Section heading" });
    expect(field).toHaveFocus();
    expect(field).toHaveValue("Soil");
    expect(field).toHaveClass("max-lg:h-10", "max-lg:text-base");
    await user.clear(field);
    await user.type(field, "Soil and drainage{Enter}");

    expect(headings()[3]).toBe("Soil and drainage");
    expect(rowOf("Soil and drainage")).toHaveFocus();
    const approval = await approve();
    expect(sentIds(approval)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(approval.sections?.[3]).toEqual({
      id: `${LIST}:3`,
      heading: "Soil and drainage",
      heading_level: "H3",
    });
  });

  it("opens on F2, and Esc puts the old heading back", async () => {
    const { user, approve } = renderOutline();

    await focusRow("Timing");
    await user.keyboard("{F2}");
    const field = screen.getByRole("textbox", { name: "Section heading" });
    await user.type(field, " and frost dates{Escape}");

    expect(
      screen.queryByRole("textbox", { name: "Section heading" }),
    ).not.toBeInTheDocument();
    expect(headings().at(-1)).toBe("Timing");
    expect(rowOf("Timing")).toHaveFocus();
    expect(await approve()).not.toHaveProperty("sections");
  });

  it("leaves the keys to the field while it is open", async () => {
    const { user } = renderOutline();

    await focusRow("Soil");
    await user.keyboard("{Enter}");
    const field = screen.getByRole("textbox", { name: "Section heading" });
    // A space, Backspace, Delete, Home and the arrows are typing here, not the tree's shortcuts.
    await user.type(
      field,
      " x{Backspace}{Delete}{Home}{ArrowDown}{Alt>}{ArrowUp}{/Alt}",
    );

    expect(field).toHaveFocus();
    expect(field).toHaveValue("Soil ");
    expect(headings()).toHaveLength(6);
    expect(toast).not.toHaveBeenCalled();
  });

  it("opens on a double-click of the heading and from the pencil", async () => {
    const { user } = renderOutline();

    await user.dblClick(screen.getByRole("button", { name: "Bed sizes" }));
    const field = screen.getByRole("textbox", { name: "Section heading" });
    expect(field).toHaveValue("Bed sizes");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Rename Timing" }));
    expect(
      screen.getByRole("textbox", { name: "Section heading" }),
    ).toHaveValue("Timing");
  });

  it("has Cancel and Save for a phone, which has no Esc key", async () => {
    const { user, approve } = renderOutline();

    await user.click(screen.getByRole("button", { name: "Rename Timing" }));
    await user.type(
      screen.getByRole("textbox", { name: "Section heading" }),
      " it right",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(headings().at(-1)).toBe("Timing");
    expect(rowOf("Timing")).toHaveFocus();

    await user.keyboard("{Enter}");
    await user.type(
      screen.getByRole("textbox", { name: "Section heading" }),
      " it right",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(headings().at(-1)).toBe("Timing it right");
    expect(rowOf("Timing it right")).toHaveFocus();
    expect((await approve()).sections?.[6]).toEqual({
      id: `${LIST}:6`,
      heading: "Timing it right",
      heading_level: "H2",
    });
  });

  it("keeps what was typed when the field is left, and ignores a blank heading", async () => {
    const { user } = renderOutline();

    await user.click(screen.getByRole("button", { name: "Rename Timing" }));
    await user.type(
      screen.getByRole("textbox", { name: "Section heading" }),
      " it right",
    );
    await user.click(screen.getByRole("tab", { name: "Outline" }));
    expect(headings().at(-1)).toBe("Timing it right");

    await user.click(
      screen.getByRole("button", { name: "Rename Timing it right" }),
    );
    const field = screen.getByRole("textbox", { name: "Section heading" });
    await user.clear(field);
    await user.type(field, "   {Enter}");
    expect(headings().at(-1)).toBe("Timing it right");
  });
});

describe("the row menu, the fallback for every action", () => {
  it("opens on Shift+F10 and on the context-menu key, each action with its keys", async () => {
    const { user } = renderOutline();

    await focusRow("Planning beds");
    await user.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await screen.findByRole("menu");
    const items = within(menu)
      .getAllByRole("menuitem")
      .map((item) => [
        item.textContent,
        item.getAttribute("aria-keyshortcuts"),
      ]);
    expect(items).toEqual([
      ["RenameEnter", "Enter"],
      ["Move upAlt+↑", "Alt+ArrowUp"],
      ["Move downAlt+↓", "Alt+ArrowDown"],
      ["Make a subsection (H3)Alt+→", "Alt+ArrowRight"],
      ["Add section below", null],
      ["Add subsection", null],
      ["RemoveDelete", "Delete"],
    ]);
    // The keys are shown, and named for assistive technology by the attribute, not twice.
    expect(
      within(menu).getByRole("menuitem", { name: "Move up" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(rowOf("Planning beds")).toHaveFocus());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.keyboard("{ContextMenu}");
    expect(
      await screen.findByRole("menuitem", { name: "Rename" }),
    ).toBeInTheDocument();
  });

  it("moves a section down and up, with focus back on the row it moved", async () => {
    const { user, approve } = renderOutline();

    await chooseFromMenu(user, "Choosing the spot", "Move down");
    expect(headings().slice(1, 4)).toEqual([
      "Planning beds",
      "Bed sizes",
      "Choosing the spot",
    ]);
    await waitFor(() => expect(rowOf("Choosing the spot")).toHaveFocus());
    expectSaid(
      "Moved Choosing the spot and its 2 subsections to position 4 of 7, after Bed sizes.",
    );

    await chooseFromMenu(user, "Timing", "Move up");
    expect(headings().slice(3)).toEqual([
      "Timing",
      "Choosing the spot",
      "Sun hours",
      "Soil",
    ]);
    await waitFor(() => expect(rowOf("Timing")).toHaveFocus());
    expect(sentIds(await approve())).toEqual([0, 4, 5, 6, 1, 2, 3]);
  });

  it("offers no move past either end, and no subsection of nothing", async () => {
    const { user } = renderOutline();

    await user.click(
      screen.getByRole("button", { name: "Actions for Why plan" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Move up" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("menuitem", { name: "Move down" }),
    ).not.toHaveAttribute("aria-disabled");
    const level = screen.getByRole("menuitem", {
      name: /^Make a subsection \(H3\)/,
    });
    expect(level).toHaveAttribute("aria-disabled", "true");
    expect(level).toHaveTextContent("The first section can't be a subsection");
    await user.keyboard("{Escape}");

    await user.click(
      screen.getByRole("button", { name: "Actions for Timing" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Move down" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("changes the level both ways, in plain words", async () => {
    const { user, approve } = renderOutline();

    await chooseFromMenu(user, "Timing", "Make a subsection (H3)");
    expect(rowOf("Timing")).toHaveAttribute("aria-level", "2");
    expectSaid("Timing is now a subsection of Planning beds.");
    await waitFor(() => expect(rowOf("Timing")).toHaveFocus());

    await chooseFromMenu(user, "Soil", "Make a section (H2)");
    expect(rowOf("Soil")).toHaveAttribute("aria-level", "1");
    expectSaid("Soil is now a section.");

    const approval = await approve();
    expect(approval.sections?.[3]).toEqual({
      id: `${LIST}:3`,
      heading: "Soil",
      heading_level: "H2",
    });
    expect(approval.sections?.[6]).toEqual({
      id: `${LIST}:6`,
      heading: "Timing",
      heading_level: "H3",
    });
  });

  it("adds a section below a section's subsections, focused and sent as new in its place", async () => {
    const { user, approve } = renderOutline();

    await chooseFromMenu(user, "Choosing the spot", "Add section below");
    const field = screen.getByRole("textbox", { name: "New section heading" });
    expect(field).toHaveFocus();
    await user.type(field, "Tools{Enter}");

    expect(headings().slice(3, 6)).toEqual(["Soil", "Tools", "Planning beds"]);
    expect(rowOf("Tools")).toHaveFocus();
    expect(rowOf("Tools")).toHaveAccessibleDescription("New");
    expectSaid("Added Tools as a section, position 5 of 8.");
    expect(screen.getByText("1 of 6 new sections")).toBeInTheDocument();
    const approval = await approve();
    expect(sentIds(approval)).toEqual([0, 1, 2, 3, "Tools", 4, 5, 6]);
    expect(approval.sections?.[4]).toEqual({
      new: true,
      list: LIST,
      heading: "Tools",
      heading_level: "H2",
    });
  });

  it("adds a subsection below a subsection, and gives focus back when it is cancelled", async () => {
    const { user, approve } = renderOutline();

    await chooseFromMenu(user, "Sun hours", "Add subsection below");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "{Escape}",
    );
    expect(
      screen.queryByRole("textbox", { name: "New subsection heading" }),
    ).not.toBeInTheDocument();
    expect(rowOf("Sun hours")).toHaveFocus();
    expect(headings()).toHaveLength(7);

    await chooseFromMenu(user, "Sun hours", "Add subsection below");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Wind{Enter}",
    );
    expect(headings().slice(2, 5)).toEqual(["Sun hours", "Wind", "Soil"]);
    expectSaid(
      "Added Wind as a subsection of Choosing the spot, position 4 of 8.",
    );
    expect((await approve()).sections?.[3]).toEqual({
      new: true,
      list: LIST,
      heading: "Wind",
      heading_level: "H3",
    });
  });

  it("removes a section, with focus on the next one", async () => {
    const { user, approve } = renderOutline();

    await chooseFromMenu(user, "Planning beds", "Remove");

    expect(headings()).toEqual([
      "Why plan",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Timing",
    ]);
    await waitFor(() => expect(rowOf("Timing")).toHaveFocus());
    expectSaid(
      "Removed Planning beds and its subsection. Undo is in the notification.",
    );
    expect(sentIds(await approve())).toEqual([0, 1, 2, 3, 6]);
  });

  it("starts a rename, with the field focused", async () => {
    const { user } = renderOutline();

    await chooseFromMenu(user, "Soil", "Rename");
    const field = screen.getByRole("textbox", { name: "Section heading" });
    await waitFor(() => expect(field).toHaveFocus());
    await user.type(field, " health{Enter}");
    expect(headings()[3]).toBe("Soil health");
  });
});

describe("adding sections", () => {
  it("adds in place from the line between two rows, a pointer's shortcut", async () => {
    const { user, approve } = renderOutline();

    // Above a section: a section. The line is for a pointer only (the menu does the same).
    const above = rowOf("Planning beds").querySelector(
      'button[aria-hidden="true"]',
    ) as HTMLElement;
    expect(above).toHaveTextContent("Add a section here");
    expect(above).toHaveAttribute("tabindex", "-1");
    expect(above).toHaveClass("max-lg:hidden");
    fireEvent.click(above);
    await user.type(
      screen.getByRole("textbox", { name: "New section heading" }),
      "Tools{Enter}",
    );
    expect(headings().slice(3, 6)).toEqual(["Soil", "Tools", "Planning beds"]);

    // Above a subsection: a subsection, in that section.
    const inside = rowOf("Soil").querySelector(
      'button[aria-hidden="true"]',
    ) as HTMLElement;
    expect(inside).toHaveTextContent("Add a subsection here");
    fireEvent.click(inside);
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Wind{Enter}",
    );
    expect(headings().slice(2, 5)).toEqual(["Sun hours", "Wind", "Soil"]);

    const approval = await approve();
    expect(sentIds(approval)).toEqual([0, 1, 2, "Wind", 3, "Tools", 4, 5, 6]);
    expect(approval.sections?.[3]).toMatchObject({ heading_level: "H3" });
    expect(approval.sections?.[5]).toMatchObject({ heading_level: "H2" });
  });

  // Soil (Soil types (Clay, Sand), Drainage) · Watering: a pillar page's H4s.
  const PILLAR: [string, Level, number][] = [
    ["Soil", "H2", 300],
    ["Soil types", "H3", 200],
    ["Clay", "H4", 100],
    ["Sand", "H4", 100],
    ["Drainage", "H3", 200],
    ["Watering", "H2", 300],
  ];
  const insertLine = (name: string) =>
    rowOf(name).querySelector('button[aria-hidden="true"]');

  it("offers no insert line above an H4, where a new row would take the H4s from their subsection", () => {
    renderOutline({ sections: PILLAR });

    expect(insertLine("Clay")).not.toBeInTheDocument();
    expect(insertLine("Sand")).not.toBeInTheDocument();
    // Everywhere else the line is offered, at the level of the row it sits above.
    expect(insertLine("Soil")).toHaveTextContent("Add a section here");
    expect(insertLine("Soil types")).toHaveTextContent("Add a subsection here");
    expect(insertLine("Drainage")).toHaveTextContent("Add a subsection here");
    expect(insertLine("Watering")).toHaveTextContent("Add a section here");
  });

  it("adds below a subsection after its H4s, which stay under it", async () => {
    const { user, approve } = renderOutline({ sections: PILLAR });

    await chooseFromMenu(user, "Soil types", "Add subsection below");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Texture{Enter}",
    );

    expect(headings()).toEqual([
      "Soil",
      "Soil types",
      "Clay",
      "Sand",
      "Texture",
      "Drainage",
      "Watering",
    ]);
    expectSaid("Added Texture as a subsection of Soil, position 5 of 7.");
    const approval = await approve();
    expect(sentIds(approval)).toEqual([0, 1, 2, 3, "Texture", 4, 5]);
    expect(approval.sections?.slice(1, 5)).toEqual([
      { id: `${LIST}:1`, heading: "Soil types", heading_level: "H3" },
      { id: `${LIST}:2`, heading: "Clay", heading_level: "H4" },
      { id: `${LIST}:3`, heading: "Sand", heading_level: "H4" },
      { new: true, list: LIST, heading: "Texture", heading_level: "H3" },
    ]);
  });

  it("adds a subsection to a section after everything under it, and offers an H4 no row beside it", async () => {
    const { user, approve } = renderOutline({ sections: PILLAR });

    await chooseFromMenu(user, "Soil", "Add subsection");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Compost{Enter}",
    );
    expect(headings().slice(3)).toEqual([
      "Sand",
      "Drainage",
      "Compost",
      "Watering",
    ]);
    expect(sentIds(await approve())).toEqual([0, 1, 2, 3, 4, "Compost", 5]);

    await user.click(screen.getByRole("button", { name: "Actions for Clay" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(
      screen.queryByRole("menuitem", { name: /^Add / }),
    ).not.toBeInTheDocument();
  });

  it("gives focus back to Add section when the new heading is cancelled", async () => {
    const { user } = renderOutline();

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Add section" })).toHaveFocus();
    expect(headings()).toHaveLength(7);
  });

  it("stops at six new sections and says why", async () => {
    const { user, approve } = renderOutline({
      sections: [
        ["Soil", "H2", 300],
        ["Watering", "H2", 300],
      ],
    });

    for (let count = 1; count <= 6; count += 1) {
      await user.click(screen.getByRole("button", { name: "Add section" }));
      await user.type(
        screen.getByRole("textbox", { name: "New section heading" }),
        `New ${count}{Enter}`,
      );
    }

    expect(
      screen.getByText(
        "6 of 6 new sections · one approval adds at most 6 sections",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add section" })).toBeDisabled();
    expect(
      grid().querySelector('button[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actions for Soil" }));
    const below = await screen.findByRole("menuitem", {
      name: /^Add section below/,
    });
    expect(below).toHaveAttribute("aria-disabled", "true");
    expect(below).toHaveTextContent("One approval adds at most 6 sections");
    await user.keyboard("{Escape}");

    const approval = await approve();
    expect(approval.sections?.filter((edit) => "new" in edit)).toHaveLength(6);

    // Removing one frees a place; its Undo is held once the place is taken again.
    await chooseFromMenu(user, "New 1", "Remove");
    const [, removed] = lastToast();
    expect(screen.getByText("5 of 6 new sections")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(
      screen.getByRole("textbox", { name: "New section heading" }),
      "New 7{Enter}",
    );
    act(() => removed.action.onClick());
    expect(headings()).not.toContain("New 1");
    expectSaid(
      "Can't undo: one approval adds at most 6 sections. Remove one first.",
    );
    expect(lastToast()[0]).toBe(
      "Can't undo: one approval adds at most 6 sections. Remove one first.",
    );
  });
});

describe("dragging a section by its handle", () => {
  // jsdom lays nothing out: each row is 40 px tall, in the order the rows are in.
  const rectAt = (top: number, height: number) =>
    ({
      top,
      bottom: top + height,
      left: 0,
      right: 600,
      width: 600,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  // jsdom has no PointerEvent, and the drag starts only from a primary pointer's press: without one
  // the handle's press is a plain event and no drag begins.
  class TestPointerEvent extends MouseEvent {
    readonly isPrimary: boolean;
    readonly pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.isPrimary = init.isPrimary ?? true;
      this.pointerId = init.pointerId ?? 1;
    }
  }
  const pointerWindow = window as unknown as { PointerEvent?: unknown };
  beforeAll(() => {
    pointerWindow.PointerEvent = TestPointerEvent;
  });
  afterAll(() => {
    delete pointerWindow.PointerEvent;
  });

  beforeEach(() => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (!this.hasAttribute("data-row-key")) return rectAt(0, 0);
        const rows = Array.from(document.querySelectorAll("[data-row-key]"));
        return rectAt(rows.indexOf(this) * 40, 40);
      });
  });
  afterEach(() => jest.restoreAllMocks());

  const drag = async (heading: string, toY: number) => {
    const row = rowOf(heading);
    const handle = row.querySelector(".cursor-grab") as HTMLElement;
    const fromY = row.getBoundingClientRect().top + 20;
    fireEvent.pointerDown(handle, {
      button: 0,
      isPrimary: true,
      clientX: 10,
      clientY: fromY,
    });
    // Past the 4 px that tells a drag from a click, then to where it should land.
    await act(async () => {
      fireEvent.pointerMove(document, { clientX: 10, clientY: fromY + 8 });
    });
    await act(async () => {
      fireEvent.pointerMove(document, { clientX: 10, clientY: toY });
    });
  };
  // The drag library stops every click on the document for 50 ms after a drag ends, so the release
  // isn't taken as a click on what was dragged (@dnd-kit/core's sensor removes its click listener
  // on a 50 ms timer). A test that clicks Approve straight after the drop would race that timer
  // and, when it lost, find the button never clicked. Wait the guard out.
  const CLICK_GUARD_MS = 50;
  const drop = () =>
    act(async () => {
      fireEvent.pointerUp(document);
      await new Promise((resolve) => setTimeout(resolve, CLICK_GUARD_MS + 30));
    });

  it("moves a section with its subsections to the gap between whole sections", async () => {
    const { approve } = renderOutline();

    // Onto "Bed sizes" (200 to 240 px): the nearest gap an H2 may take is the one after it.
    await drag("Choosing the spot", 225);
    await waitFor(() =>
      expect(rowOf("Choosing the spot")).toHaveClass("opacity-40"),
    );
    expect(rowOf("Choosing the spot")).toHaveTextContent("· moving");
    expect(rowOf("Sun hours")).toHaveClass("opacity-40");
    expect(rowOf("Planning beds")).not.toHaveClass("opacity-40");
    await drop();

    await waitFor(() =>
      expect(headings()).toEqual([
        "Why plan",
        "Planning beds",
        "Bed sizes",
        "Choosing the spot",
        "Sun hours",
        "Soil",
        "Timing",
      ]),
    );
    expectSaid(
      "Moved Choosing the spot and its 2 subsections to position 4 of 7, after Bed sizes.",
    );
    expect(sentIds(await approve())).toEqual([0, 4, 5, 1, 2, 3, 6]);
  });

  it("leaves a section where it was when it is dropped on its own place", async () => {
    const { approve } = renderOutline();

    await drag("Timing", 250);
    // The drag did start: without this the test would pass with no drag at all.
    await waitFor(() => expect(rowOf("Timing")).toHaveClass("opacity-40"));
    await drop();

    await waitFor(() => expect(rowOf("Timing")).not.toHaveClass("opacity-40"));

    expect(headings()).toEqual(SECTIONS.map(([heading]) => heading));
    expect(await approve()).not.toHaveProperty("sections");
  });
});
