import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import {
  OutlineRejectSection,
  OutlineReview,
} from "@/components/generate-content/outline-review";
import type { OutlineApproval } from "@/lib/generate-content/outline-review";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { KeywordCluster, Outline } from "@/types/generate-content";
import type { CreditBalance } from "@/types/subscription";

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ data: { personas: [] } }),
}));
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({ hasPermission: true, isLoading: false }),
}));
jest.mock("sonner", () => ({ toast: jest.fn() }));

// No credits loaded unless a test sets them, and no request for them.
const setCredits = (credits: CreditBalance | null) =>
  act(() =>
    useSubscriptionStore.setState({
      credits,
      fetchCredits: jest.fn().mockResolvedValue(undefined),
    }),
  );
beforeEach(() => setCredits(null));

const section = (heading: string, words: number) => ({
  heading,
  heading_level: "H2",
  description: `What ${heading} covers.`,
  suggested_word_count: words,
  questions_to_answer: [`Why ${heading}?`],
  key_points: [`${heading} point`],
});

// A blog outline as the backend holds it, and the gate it sends (rext-backend
// src/flow/engines/content/review/outline.py).
const outline = {
  title: "Running shoes for beginners",
  brief: "How to choose your first pair.",
  tone: "Friendly",
  target_audience: ["Beginners"],
  target_word_count: 1800,
  keywords_to_include: ["running shoes"],
  focus_keyphrase: "running shoes for beginners",
  schema_type: "BlogPosting",
  status: "reviewing",
  sections: [],
  structure: {
    sections: [
      section("Why the right shoe matters", 300),
      section("Cushioning and support", 400),
      section("How to get fitted", 350),
    ],
  },
} as unknown as Outline;

const rows = [
  "Why the right shoe matters",
  "Cushioning and support",
  "How to get fitted",
].map((heading, index) => ({
  id: `structure.sections:${index}`,
  list: "structure.sections",
  heading,
  heading_level: "H2",
}));

const baseGate = {
  type: "outline_review",
  editable_sections: rows,
  recommended_brand_prominence: "subtle",
  brand_voice_promotion: {
    brand_name: "Acme",
    about: "Shoes",
    selling_position: "Fit first",
    score: 0.7,
    recommended: true,
  },
  internal_links: [
    {
      url: "https://acme.test/fit",
      title: "Fit guide",
      score: 0.8,
      status: "published",
    },
    {
      url: "https://acme.test/old",
      title: "Old post",
      score: 0.2,
      status: "published",
    },
  ],
};

function renderReview({
  gate = baseGate as Record<string, unknown>,
  current = outline as Outline | null,
  rawTokens = "",
  clusters = [] as KeywordCluster[],
} = {}) {
  const onApprove = jest.fn<void, [OutlineApproval]>();
  render(
    <OutlineReview
      outline={current}
      rawTokens={rawTokens}
      isLoading={false}
      gate={gate}
      keywordClusters={clusters}
      onApprove={onApprove}
      onReject={jest.fn()}
    />,
  );
  const approve = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(
      screen.getByRole("button", { name: /approve and generate/i }),
    );
    return onApprove.mock.calls.at(-1)?.[0] as OutlineApproval;
  };
  return { onApprove, approve };
}

const sectionList = () => screen.getByRole("region", { name: "Sections" });
// The tree grid's rows, in order, by the heading each is named after.
const headings = () =>
  Array.from(
    sectionList().querySelectorAll('[data-slot="outline-heading"]'),
    (heading) => heading.textContent,
  );

async function chooseFromMenu(
  user: ReturnType<typeof userEvent.setup>,
  rowHeading: string,
  item: string,
) {
  await user.click(
    screen.getByRole("button", { name: `Actions for ${rowHeading}` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: item }));
}

describe("OutlineReview, the outline tree", () => {
  beforeEach(() => (toast as unknown as jest.Mock).mockClear());

  it("shows the gate's sections in order with their word budgets, the plan folded", async () => {
    const user = userEvent.setup();
    renderReview();

    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Cushioning and support",
      "How to get fitted",
    ]);
    expect(
      screen.getByRole("row", { name: "Cushioning and support" }),
    ).toHaveAccessibleDescription("~400 words");
    expect(
      screen.queryByText("Why Cushioning and support?"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cushioning and support" }),
    );
    expect(screen.getByText("Why Cushioning and support?")).toBeInTheDocument();
    expect(
      screen.getByText("Cushioning and support point"),
    ).toBeInTheDocument();
  });

  it("sends no sections when nothing changed", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    const approval = await approve(user);
    expect(approval).not.toHaveProperty("sections");
    expect(approval).toMatchObject({
      tone: "Friendly",
      target_word_count: 1800,
    });
  });

  it("moves a section up from its menu, and approval sends the new order", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    await chooseFromMenu(user, "How to get fitted", "Move up");
    expect(headings()[1]).toBe("How to get fitted");

    const approval = await approve(user);
    expect(approval.sections).toEqual([
      {
        id: "structure.sections:0",
        heading: "Why the right shoe matters",
        heading_level: "H2",
      },
      {
        id: "structure.sections:2",
        heading: "How to get fitted",
        heading_level: "H2",
      },
      {
        id: "structure.sections:1",
        heading: "Cushioning and support",
        heading_level: "H2",
      },
    ]);
  });

  it("renames a section in place", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    await chooseFromMenu(user, "Cushioning and support", "Rename");
    const input = screen.getByRole("textbox", { name: "Section heading" });
    await user.clear(input);
    await user.type(input, "Cushioning, support and stability{Enter}");

    expect(headings()[1]).toBe("Cushioning, support and stability");
    const approval = await approve(user);
    expect(approval.sections?.[1]).toEqual({
      id: "structure.sections:1",
      heading: "Cushioning, support and stability",
      heading_level: "H2",
    });
  });

  it("removes a section with an undo", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    await chooseFromMenu(user, "Cushioning and support", "Remove");
    expect(headings()).toEqual([
      "Why the right shoe matters",
      "How to get fitted",
    ]);
    const [message, options] = (toast as unknown as jest.Mock).mock.calls[0];
    expect(message).toBe('Removed "Cushioning and support"');

    const removed = await approve(user);
    expect(
      removed.sections?.map((edit) => ("id" in edit ? edit.id : null)),
    ).toEqual(["structure.sections:0", "structure.sections:2"]);

    act(() => options.action.onClick());
    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Cushioning and support",
      "How to get fitted",
    ]);
    expect(await approve(user)).not.toHaveProperty("sections");
  });

  it("removes a section with its subsections, says so, and Undo brings all back", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview({
      gate: {
        ...baseGate,
        editable_sections: rows.map((row, index) =>
          index === 2 ? { ...row, heading_level: "H3" } : row,
        ),
      },
    });

    await chooseFromMenu(user, "Cushioning and support", "Remove");
    expect(headings()).toEqual(["Why the right shoe matters"]);
    const [message, options] = (toast as unknown as jest.Mock).mock.calls[0];
    expect(message).toBe('Removed "Cushioning and support" and its subsection');
    const removed = await approve(user);
    expect(
      removed.sections?.map((edit) => ("id" in edit ? edit.id : null)),
    ).toEqual(["structure.sections:0"]);

    act(() => options.action.onClick());
    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Cushioning and support",
      "How to get fitted",
    ]);
  });

  it("puts every section back with Reset sections", async () => {
    const user = userEvent.setup();
    renderReview();

    await chooseFromMenu(user, "How to get fitted", "Move up");
    await user.click(screen.getByRole("button", { name: "Reset sections" }));
    expect(headings()[2]).toBe("How to get fitted");
    expect(
      screen.queryByRole("button", { name: "Reset sections" }),
    ).not.toBeInTheDocument();
  });

  it("offers Add section only for a list the gate takes additions to", () => {
    renderReview();
    expect(
      screen.queryByRole("button", { name: "Add section" }),
    ).not.toBeInTheDocument();
  });

  it("adds a section the gate accepts, sent as new", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview({
      gate: { ...baseGate, section_additions: ["structure.sections"] },
    });

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(
      screen.getByRole("textbox", { name: "New section heading" }),
      "Caring for them{Enter}",
    );

    expect(headings()[3]).toBe("Caring for them");
    const approval = await approve(user);
    expect(approval.sections?.[3]).toEqual({
      new: true,
      list: "structure.sections",
      heading: "Caring for them",
      heading_level: "H2",
    });
  });

  // E31: a subsection added by hand under an H2. The second section has one subsection already.
  const withSubsection = {
    ...baseGate,
    section_additions: ["structure.sections"],
    editable_sections: rows.map((row, index) =>
      index === 2 ? { ...row, heading_level: "H3" } : row,
    ),
  };

  it("adds a subsection under an H2, after its subsections, sent as a new H3", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview({ gate: withSubsection });

    await chooseFromMenu(user, "Cushioning and support", "Add subsection");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Heel drop{Enter}",
    );

    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Cushioning and support",
      "How to get fitted",
      "Heel drop",
    ]);
    const approval = await approve(user);
    expect(approval.sections?.[3]).toEqual({
      new: true,
      list: "structure.sections",
      heading: "Heel drop",
      heading_level: "H3",
    });
  });

  it("puts a subsection right under an H2 that has none", async () => {
    const user = userEvent.setup();
    renderReview({ gate: withSubsection });

    await chooseFromMenu(user, "Why the right shoe matters", "Add subsection");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Overpronation{Enter}",
    );

    expect(headings()[1]).toBe("Overpronation");
  });

  it("offers Add subsection only on an H2, and not in a list without levels", async () => {
    const user = userEvent.setup();
    renderReview({ gate: withSubsection });

    await user.click(
      screen.getByRole("button", { name: "Actions for How to get fitted" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Add subsection" }),
    ).not.toBeInTheDocument();
  });

  it("offers no Add subsection when the sections have no levels", async () => {
    const user = userEvent.setup();
    renderReview({
      gate: {
        ...baseGate,
        section_additions: ["structure.sections"],
        editable_sections: rows.map(({ heading_level: _level, ...row }) => row),
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Actions for Why the right shoe matters",
      }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Add subsection" }),
    ).not.toBeInTheDocument();
  });

  it("removes an added subsection with its H2, and Undo brings both back", async () => {
    const user = userEvent.setup();
    renderReview({ gate: withSubsection });
    await chooseFromMenu(user, "Cushioning and support", "Add subsection");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Heel drop{Enter}",
    );

    await chooseFromMenu(user, "Cushioning and support", "Remove");
    expect(headings()).toEqual(["Why the right shoe matters"]);

    const [, options] = (toast as unknown as jest.Mock).mock.calls.at(-1);
    act(() => options.action.onClick());
    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Cushioning and support",
      "How to get fitted",
      "Heel drop",
    ]);
  });

  it("keeps a subsection under its H2 when the next H2's removal is undone", async () => {
    const user = userEvent.setup();
    renderReview({ gate: withSubsection });

    // The next section goes, with its subsection, its Undo still offered...
    await chooseFromMenu(user, "Cushioning and support", "Remove");
    const [, options] = (toast as unknown as jest.Mock).mock.calls.at(-1);
    // ...then a subsection is added to the section before it...
    await chooseFromMenu(user, "Why the right shoe matters", "Add subsection");
    await user.type(
      screen.getByRole("textbox", { name: "New subsection heading" }),
      "Overpronation{Enter}",
    );
    // ...and the Undo brings the removed section back after it, not between it and its parent.
    act(() => options.action.onClick());

    expect(headings()).toEqual([
      "Why the right shoe matters",
      "Overpronation",
      "Cushioning and support",
      "How to get fitted",
    ]);
  });

  it("rebuilds the tree when a regenerated outline changes only a level", async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn<void, [OutlineApproval]>();
    const view = (gate: Record<string, unknown>) => (
      <OutlineReview
        outline={outline}
        rawTokens=""
        isLoading={false}
        gate={gate}
        onApprove={onApprove}
        onReject={jest.fn()}
      />
    );
    const { rerender } = render(view(baseGate));
    rerender(
      view({
        ...baseGate,
        editable_sections: rows.map((row, index) =>
          index === 2 ? { ...row, heading_level: "H3" } : row,
        ),
      }),
    );

    await chooseFromMenu(user, "How to get fitted", "Move up");
    await user.click(
      screen.getByRole("button", { name: /approve and generate/i }),
    );
    expect(
      onApprove.mock.calls[0][0].sections?.find(
        (edit) => "id" in edit && edit.id === "structure.sections:2",
      ),
    ).toMatchObject({ heading_level: "H3" });
  });

  it("shows an older gate's outline read-only, from its own sections", () => {
    renderReview({
      gate: { type: "outline_review" },
      current: {
        ...outline,
        sections: [
          {
            heading: "Why the right shoe matters",
            description: "",
            key_points: ["Fit first"],
          },
          { heading: "How to get fitted", description: "", key_points: [] },
        ],
      } as Outline,
    });

    const list = screen.getByRole("region", { name: "Sections" });
    expect(
      within(list).getByText("Why the right shoe matters"),
    ).toBeInTheDocument();
    expect(within(list).getByText("Fit first")).toBeInTheDocument();
    expect(within(list).getByText("How to get fitted")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reorder|move/i }),
    ).not.toBeInTheDocument();
  });

  // FB2.15: the FAQ shows under a read-only outline too, once. The backend's blocks often hold one
  // headed "Faqs" (its label for the outline's `faqs`), as a real how-to run's did.
  const faqs = [
    "How often should I replace them?",
    "Do I need a gait analysis?",
  ];
  const stepsBlock = {
    heading: "Steps",
    items: [{ label: "Measure your foot", points: ["Late in the day"] }],
  };
  const renderReadOnly = (blocks: unknown[]) =>
    renderReview({
      gate: { type: "outline_review" },
      current: { ...outline, faqs, _render: { blocks } } as unknown as Outline,
    });

  it("lists the FAQ under a read-only outline whose blocks don't hold it", () => {
    renderReadOnly([stepsBlock]);

    expect(screen.getByRole("region", { name: "Steps" })).toBeInTheDocument();
    const faq = screen.getByRole("region", { name: "FAQ" });
    expect(
      within(faq)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(faqs.map((question, index) => `${index + 1}${question}`));
    expect(
      within(faq).getByText(/^Answered at the end of the article\./),
    ).toBeInTheDocument();
  });

  it("lists the FAQ once when the read-only blocks already hold it", () => {
    renderReadOnly([
      stepsBlock,
      {
        heading: "Faqs",
        items: faqs.map((label) => ({ label, points: [] })),
      },
    ]);

    // The backend's own block shows the questions; no second list beneath.
    const block = screen.getByRole("region", { name: "Faqs" });
    for (const question of faqs) {
      expect(within(block).getByText(question)).toBeInTheDocument();
      expect(screen.getAllByText(question)).toHaveLength(1);
    }
    expect(
      screen.queryByRole("region", { name: "FAQ" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Answered at the end of the article\./),
    ).not.toBeInTheDocument();
  });

  it("lists the sections as they stream, with approval held", () => {
    renderReview({
      current: null,
      rawTokens:
        '{"title":"Running shoes","structure":{"sections":[{"heading":"Why the right shoe matters"},{"heading":"Cush',
    });

    expect(
      screen.getByRole("heading", { name: "Running shoes" }),
    ).toBeInTheDocument();
    const streaming = screen.getByRole("list", {
      name: "Sections, being written",
    });
    expect(
      within(streaming).getByText("Why the right shoe matters"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve and generate/i }),
    ).toBeDisabled();
  });
});

describe("OutlineReview, the brief", () => {
  it("preselects the recommended prominence and sends the one chosen", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    expect(screen.getByRole("radio", { name: /subtle/i })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /prominent/i }));

    const approval = await approve(user);
    expect(approval.brand_prominence).toBe("prominent");
    expect(approval).not.toHaveProperty("promote_brand");
  });

  it("preselects the relevant links and sends the selection", async () => {
    const user = userEvent.setup();
    const { approve } = renderReview();

    expect(screen.getByText("1 of 2 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /old post/i }));
    expect(screen.getByText("2 of 2 selected")).toBeInTheDocument();

    const approval = await approve(user);
    expect(approval.selected_internal_links?.map((link) => link.url)).toEqual([
      "https://acme.test/fit",
      "https://acme.test/old",
    ]);
  });
});

describe("OutlineReview, the brief's settings", () => {
  it("puts a target the step won't take back, so the field shows what approval sends", async () => {
    const user = userEvent.setup();
    // The view refuses a count outside the type's range and keeps the outline.
    const onUpdate = jest.fn();
    render(
      <OutlineReview
        outline={outline}
        rawTokens=""
        isLoading={false}
        gate={baseGate}
        onUpdate={onUpdate}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    const words = screen.getByLabelText("Target words");

    await user.clear(words);
    await user.type(words, "lots{Enter}");
    expect(onUpdate).not.toHaveBeenCalled();
    expect(words).toHaveValue("1800");

    await user.clear(words);
    await user.type(words, "99999{Enter}");
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ target_word_count: 99999 }),
    );
    expect(words).toHaveValue("1800");
  });
});

describe("OutlineReview, the approval", () => {
  it("gives Approve's cost and the balance it leaves in its tooltip, not on the label", async () => {
    setCredits({
      current_credits: 4540,
      credits_per_month: 5000,
      credits_reset_date: null,
      articles_remaining: 302,
      plan_name: "Growth",
      runs: {
        analyze: {
          cost: 1,
          minimum_balance: 15,
          can_run: true,
          balance_after: 4539,
          stages: [],
        },
        change_keyword: {
          cost: 1,
          minimum_balance: 1,
          can_run: true,
          balance_after: 4539,
          stages: [],
        },
        regenerate_outline: {
          cost: 1,
          minimum_balance: 1,
          can_run: true,
          balance_after: 4539,
          stages: [],
        },
        generate: {
          cost: 12,
          minimum_balance: 12,
          can_run: true,
          balance_after: 4528,
          stages: [],
        },
      },
    });
    const user = userEvent.setup();
    renderReview();

    const approve = screen.getByRole("button", {
      name: /approve and generate/i,
    });
    // FB2.11: the cost is in the tooltip, on hover or focus, not on the buttons.
    expect(approve).not.toHaveTextContent(/credit/);
    expect(
      screen.getByRole("button", { name: /^regenerate/i }),
    ).not.toHaveTextContent(/credit/);
    await user.hover(approve);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Balance after: 4,528 credits",
    );
  });
});

describe("The outline's feedback form (E7.3)", () => {
  function renderFeedback() {
    const onBack = jest.fn();
    const onSubmit = jest.fn();
    render(
      <OutlineRejectSection
        instruction="What should change?"
        rejectedReason="Shorter sections"
        onChange={jest.fn()}
        onSubmit={onSubmit}
        onBack={onBack}
      />,
    );
    return { onBack, onSubmit };
  }

  it("goes back to the outline without sending the feedback", async () => {
    const user = userEvent.setup();
    const { onBack, onSubmit } = renderFeedback();

    await user.click(
      screen.getByRole("button", { name: "Back to the outline" }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps Submit feedback's credit off its label and sends it once", async () => {
    setCredits({
      current_credits: 40,
      credits_per_month: 400,
      credits_reset_date: null,
      articles_remaining: 2,
      plan_name: "Starter",
      runs: {
        regenerate_outline: {
          cost: 1,
          minimum_balance: 1,
          can_run: true,
          balance_after: 39,
          stages: [],
        },
      },
    } as unknown as CreditBalance);
    const user = userEvent.setup();
    const { onSubmit } = renderFeedback();

    const submit = screen.getByRole("button", { name: /submit feedback/i });
    expect(submit).not.toHaveTextContent(/credit/);
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("OutlineReview, the Brief on narrow screens", () => {
  it("opens from the approve bar, with no floating button over Approve", async () => {
    const user = userEvent.setup();
    renderReview();

    const brief = screen.getByRole("button", { name: "Brief" });
    expect(screen.getAllByRole("button", { name: "Brief" })).toHaveLength(1);
    expect(brief).not.toHaveClass("fixed");
    // In the same row as Regenerate and Approve, at its start.
    const approveRow = screen.getByRole("button", {
      name: "Regenerate",
    }).parentElement;
    expect(approveRow?.firstElementChild).toBe(brief);
    expect(approveRow).toContainElement(
      screen.getByRole("button", { name: /approve and generate/i }),
    );
    expect(brief).toHaveClass("mr-auto", "lg:hidden");

    await user.click(brief);
    const sheet = await screen.findByRole("dialog", { name: "Brief" });
    expect(within(sheet).getByRole("radio", { name: /subtle/i })).toBeChecked();
  });
});

describe("OutlineReview, the sources", () => {
  it("has no Sources view when the run has nothing to show", () => {
    renderReview();
    expect(
      screen.queryByRole("tab", { name: "Sources" }),
    ).not.toBeInTheDocument();
  });

  it("lists the search results, the questions and the clusters", async () => {
    const user = userEvent.setup();
    renderReview({
      gate: {
        ...baseGate,
        serp_titles: [
          {
            position: 1,
            title: "Best running shoes",
            domain: "a.test",
            url: "https://a.test/best",
          },
        ],
        serp_questions: ["How often should I replace them?"],
      },
      clusters: [
        {
          cluster_name: "Fit",
          main_intent: "informational",
          keywords: [{ keyword: "shoe fitting" }],
        } as unknown as KeywordCluster,
      ],
    });

    await user.click(screen.getByRole("tab", { name: "Sources" }));
    const link = screen.getByRole("link", { name: /best running shoes/i });
    expect(link).toHaveAttribute("href", "https://a.test/best");
    expect(link).toHaveAttribute("target", "_blank");
    expect(
      screen.getByText("How often should I replace them?"),
    ).toBeInTheDocument();
    expect(screen.getByText("shoe fitting")).toBeInTheDocument();
  });
});

describe("OutlineReview, an outline that came back empty", () => {
  const emptyGate = { ...baseGate, editable_sections: [] } as Record<
    string,
    unknown
  >;

  it("says so, offers Regenerate as the one action, and no Approve", async () => {
    const user = userEvent.setup();
    const onReject = jest.fn();
    const onApprove = jest.fn();
    render(
      <OutlineReview
        outline={{} as Outline}
        rawTokens=""
        isLoading={false}
        gate={emptyGate}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The outline couldn't be drafted",
    );
    expect(
      screen.queryByRole("button", { name: /approve and generate/i }),
    ).not.toBeInTheDocument();
    // Nothing of the empty outline is on screen: no title placeholder, no tabs.
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("gives way to a regenerated outline: the tree and Approve are back", () => {
    const props = {
      rawTokens: "",
      isLoading: false,
      onApprove: jest.fn(),
      onReject: jest.fn(),
    };
    const { rerender } = render(
      <OutlineReview {...props} outline={{} as Outline} gate={emptyGate} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // While it is drafted again the outline is null: the streaming tree, no notice.
    rerender(<OutlineReview {...props} outline={null} gate={emptyGate} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<OutlineReview {...props} outline={outline} gate={baseGate} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(sectionList()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve and generate/i }),
    ).toBeEnabled();
  });

  it("doesn't go by the title: sections to review are shown, with Approve", () => {
    // An older outline, kept only as the backend's display blocks, at a gate that offers no edits.
    render(
      <OutlineReview
        outline={
          {
            _render: {
              title: "Running shoes for beginners",
              blocks: [
                {
                  heading: "Sections",
                  items: [{ label: "Cushioning and support", points: [] }],
                },
              ],
            },
          } as unknown as Outline
        }
        rawTokens=""
        isLoading={false}
        gate={emptyGate}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Cushioning and support")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve and generate/i }),
    ).toBeEnabled();
  });

  it("waits for the outline's own gate before saying so", () => {
    // The step's update puts the outline on the page a moment before its gate opens; until then
    // the page still holds the title step's gate, with no sections to read.
    const props = {
      rawTokens: "",
      isLoading: false,
      onApprove: jest.fn(),
      onReject: jest.fn(),
    };
    const { rerender } = render(
      <OutlineReview
        {...props}
        outline={outline}
        gate={{ type: "topic_selection" }}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<OutlineReview {...props} outline={outline} gate={baseGate} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(sectionList()).toBeInTheDocument();
  });
});

describe("OutlineReview, while the first outline is written", () => {
  it("shows the chosen title and the headings so far, with the run's stages beside them", () => {
    render(
      <OutlineReview
        outline={null}
        rawTokens=""
        isLoading
        gate={undefined}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        filling={{
          title: "Running shoes for beginners",
          headings: ["Why the right shoe matters", "Cushioning and support"],
          sources: {
            serpResults: [],
            questions: ["How often should I replace them?"],
            relatedSearches: ["shoe fitting"],
          },
          progress: <p>The run's stages</p>,
          strip: <p>The run's stages, one line</p>,
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Running shoes for beginners" }),
    ).toBeInTheDocument();
    const written = screen.getByRole("list", {
      name: "Sections, being written",
    });
    expect(
      within(written).getByText("Why the right shoe matters"),
    ).toBeInTheDocument();
    expect(
      within(written).getByText("Cushioning and support"),
    ).toBeInTheDocument();
    // The stages head the brief's pane, and sit above the outline as one line under 1024 px.
    const pane = screen.getByRole("complementary", { name: "Brief" });
    expect(within(pane).getByText("The run's stages")).toBeInTheDocument();
    expect(screen.getByText("The run's stages, one line")).toBeInTheDocument();
    // What it is written from is under it meanwhile, in the Outline tab: no Sources tab yet.
    const from = within(
      screen.getByRole("region", { name: "What the outline is written from" }),
    );
    expect(
      from.getByText("How often should I replace them?"),
    ).toBeInTheDocument();
    expect(from.getByText("shoe fitting")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Sources" })).toBeNull();
    // Nothing acts before the outline is whole, and the buttons say why.
    for (const name of [/approve and generate/i, "Regenerate"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(
        "You can approve once the outline is written.",
      );
    }
  });

  it("shows the streaming tree alone when the run read no sources", () => {
    render(
      <OutlineReview
        outline={null}
        rawTokens=""
        isLoading
        gate={undefined}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        filling={{
          title: "Running shoes for beginners",
          headings: [],
          progress: <p>The run's stages</p>,
          strip: null,
        }}
      />,
    );
    expect(
      screen.getByRole("list", { name: "Sections, being written" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", {
        name: "What the outline is written from",
      }),
    ).toBeNull();
  });

  it("reads the model's text as before when the run gives no headings of its own", () => {
    render(
      <OutlineReview
        outline={null}
        rawTokens={
          '{"title":"Tea at home","structure":{"sections":[{"heading":"Black tea"'
        }
        isLoading
        gate={undefined}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Tea at home" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Black tea")).toBeInTheDocument();
  });
});
