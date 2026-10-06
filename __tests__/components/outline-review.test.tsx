import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { OutlineReview } from "@/components/generate-content/outline-review";
import type { OutlineApproval } from "@/lib/generate-content/outline-review";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { KeywordCluster, Outline } from "@/types/generate-content";
import type { CreditBalance } from "@/types/subscription";

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ data: { personas: [] } }),
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
const headings = () =>
  within(sectionList())
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".font-medium")?.textContent);

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
    expect(screen.getByText("~400 words")).toBeInTheDocument();
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

describe("OutlineReview, the approval", () => {
  it("shows the article's cost and the balance it leaves on Approve", () => {
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
    renderReview();

    expect(
      screen.getByRole("button", { name: /approve and generate/i }),
    ).toHaveTextContent("· 12 credits · balance after 4,528");
    expect(
      screen.getByText("Balance after: 4,528 credits"),
    ).toBeInTheDocument();
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
