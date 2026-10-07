import { act, renderHook } from "@testing-library/react";
import { useRunStages } from "@/hooks/use-run-stages";
import { expectedStageMs } from "@/lib/generate-content/run-timings";

beforeEach(() => window.localStorage.clear());

const states = (run: ReturnType<typeof useRunStages>["run"]) =>
  run?.stages.map((stage) => stage.state);

describe("useRunStages", () => {
  it("starts a phase at its first stage and moves it with the stream's nodes", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("outline"));
    expect(states(result.current.run)).toEqual(["active", "pending"]);
    act(() => result.current.nodeDone("map_keyword_clusters"));
    expect(states(result.current.run)).toEqual(["complete", "active"]);
    act(() => result.current.settle());
    expect(states(result.current.run)).toEqual(["complete", "complete"]);
  });

  it("starts a run picked up mid-way at the stage the status names", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("article", { joined: true, at: "style" }));
    expect(states(result.current.run)).toEqual([
      "complete",
      "complete",
      "active",
      "pending",
    ]);
  });

  it("learns the times of a run watched from its start, not of one picked up mid-way", () => {
    jest.useFakeTimers({ now: 0 });
    try {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("titles", { joined: true }));
      act(() => jest.advanceTimersByTime(3000));
      act(() => result.current.settle());
      expect(expectedStageMs("titles")).toBe(10_000);

      act(() => result.current.start("titles"));
      act(() => jest.advanceTimersByTime(4000));
      act(() => result.current.settle());
      expect(expectedStageMs("titles")).toBe(4000);
    } finally {
      jest.useRealTimers();
    }
  });

  it("fails the running stage on a cancel", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("analysis"));
    act(() => result.current.fail());
    expect(states(result.current.run)).toEqual([
      "failed",
      "skipped",
      "skipped",
    ]);
  });

  // rext-control#694: beside its stages, what the run found.
  describe("what the run found", () => {
    const TITLES_JSON =
      '{"topics":[{"title":"Tea for Beginners","recommended":true,"recommendation_reason":"Plain."},{"title":"Loose Leaf Tea at Home","recommended":false,"recommendation_reason":null}]}';
    /** The text as the stream sends it: a few characters a token. */
    const tokens = (text: string): string[] => text.match(/[\s\S]{1,7}/g) ?? [];
    const SERP = {
      serp_result: {
        organic_results: [
          { position: 1, title: "Tea 101", link: "https://www.tea.example/" },
        ],
        people_ask: [{ question: "Is tea good for you?" }],
        related_searches: ["green tea"],
      },
    };

    it("reads each node's update as the stage it ends moves on", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("analysis"));
      act(() => result.current.nodeDone("fetch_serp", SERP));
      expect(states(result.current.run)).toEqual([
        "active",
        "pending",
        "pending",
      ]);
      expect(result.current.findings.results).toEqual([
        {
          position: 1,
          title: "Tea 101",
          domain: "tea.example",
          url: "https://www.tea.example/",
        },
      ]);
      act(() =>
        result.current.nodeDone("normalize_serp", {
          serp_normalized: {
            normalize_results: [{ domain: "tea.example" }],
            domain_stats: { unique_domains: 1 },
          },
        }),
      );
      expect(states(result.current.run)).toEqual([
        "complete",
        "active",
        "pending",
      ]);
      expect(result.current.findings.siteCount).toBe(1);
    });

    it("ends the writing of the titles when the model's text closes, and starts the checks", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("titles"));
      const pieces = tokens(TITLES_JSON);
      for (const piece of pieces.slice(0, -1)) {
        act(() =>
          result.current.token({ token: piece, node: "generate_topics" }),
        );
      }
      expect(states(result.current.run)).toEqual(["active", "pending"]);
      expect(result.current.findings.drafts?.[0]).toMatchObject({
        title: "Tea for Beginners",
        complete: true,
        recommended: true,
      });
      act(() =>
        result.current.token({
          token: pieces[pieces.length - 1],
          node: "generate_topics",
        }),
      );
      expect(result.current.findings.draftsDone).toBe(true);
      expect(states(result.current.run)).toEqual(["complete", "active"]);

      // The repair's text and the node's update: the checks go on to the gate.
      act(() =>
        result.current.token({ token: '{"topics":[', node: "generate_topics" }),
      );
      act(() =>
        result.current.nodeDone("generate_topics", {
          content: {
            topic_set: { topics: ["Tea for Beginners", "A Rewritten Title"] },
          },
        }),
      );
      expect(states(result.current.run)).toEqual(["complete", "active"]);
      expect(result.current.findings.drafts).toHaveLength(2);
      expect(result.current.findings.finalTitles).toEqual([
        "Tea for Beginners",
        "A Rewritten Title",
      ]);
      act(() => result.current.settle());
      expect(states(result.current.run)).toEqual(["complete", "complete"]);
    });

    it("shows the titles together when their text never streamed", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("titles"));
      // A model that streams no text sends empty tokens (its output is a tool call's arguments).
      act(() => result.current.token({ token: "", node: "generate_topics" }));
      expect(result.current.findings.drafts).toBeUndefined();
      act(() =>
        result.current.nodeDone("generate_topics", {
          content: { topic_set: { topics: ["One", "Two"] } },
        }),
      );
      expect(states(result.current.run)).toEqual(["complete", "active"]);
      expect(result.current.findings.finalTitles).toEqual(["One", "Two"]);
    });

    it("doesn't render the page for each token that changes nothing on screen", () => {
      let renders = 0;
      const { result } = renderHook(() => {
        renders += 1;
        return useRunStages();
      });
      act(() => result.current.start("outline"));
      act(() =>
        result.current.token({
          token: '{"sections":[{"heading":"Pick your beds",',
          node: "generate_outline",
        }),
      );
      expect(result.current.findings.headings).toEqual(["Pick your beds"]);
      const found = result.current.findings;
      // React may call the component once more after a change before it stops: not once a token.
      act(() =>
        result.current.token({
          token: '"description":"',
          node: "generate_outline",
        }),
      );
      const before = renders;
      // A description being written, another model's text, a token with no node, article tokens.
      for (const word of "Why the place of each bed matters more than".split(
        " ",
      )) {
        act(() =>
          result.current.token({ token: `${word} `, node: "generate_outline" }),
        );
        act(() =>
          result.current.token({ token: word, node: "extract_competitor" }),
        );
        act(() => result.current.token({ token: word, node: null }));
        act(() => result.current.custom({ type: "token", content: word }));
      }
      expect(renders).toBe(before);
      expect(result.current.findings).toBe(found);
    });

    it("keeps what the earlier steps found for the later ones, and clears a step's own when it starts again", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("analysis"));
      act(() => result.current.nodeDone("fetch_serp", SERP));
      act(() => result.current.settle());
      act(() => result.current.clear());
      expect(result.current.run).toBeNull();
      expect(result.current.findings.results).toHaveLength(1);

      act(() => result.current.start("titles"));
      for (const piece of tokens(TITLES_JSON)) {
        act(() =>
          result.current.token({ token: piece, node: "generate_topics" }),
        );
      }
      expect(result.current.findings.drafts).toHaveLength(2);
      expect(result.current.findings.titleSources).toEqual({
        relatedSearches: 1,
        questions: 1,
      });

      // New titles: the old ones go, and the new text is read from its start.
      act(() => result.current.start("titles"));
      expect(result.current.findings.drafts).toBeUndefined();
      expect(states(result.current.run)).toEqual(["active", "pending"]);
      act(() =>
        result.current.token({
          token: '{"topics":[{"title":"A New Title"',
          node: "generate_topics",
        }),
      );
      expect(
        result.current.findings.drafts?.map((draft) => draft.title),
      ).toEqual(["A New Title"]);
      expect(result.current.findings.results).toHaveLength(1);

      // A new keyword: nothing of the last one stays.
      act(() => result.current.start("analysis"));
      expect(result.current.findings).toEqual({});
    });

    it("takes what a run picked up mid-way had found from the thread's state, and keeps it as the run joins", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("analysis"));
      act(() => result.current.nodeDone("fetch_serp", SERP));
      // Another thread is opened: what this one found is not its.
      act(() => result.current.seed(null));
      expect(result.current.findings).toEqual({});

      act(() =>
        result.current.seed(
          {
            values: {},
            tasks: [{ name: "serp_engine", state: { values: SERP } }],
          },
          { phase: "analysis", id: "competitors" },
        ),
      );
      act(() =>
        result.current.start("analysis", { joined: true, at: "competitors" }),
      );
      expect(states(result.current.run)).toEqual([
        "complete",
        "active",
        "pending",
      ]);
      expect(result.current.findings.results).toHaveLength(1);
      expect(result.current.findings.competitors).toBeUndefined();
    });

    it("reads an outline written again from its own start, not after the first one's text", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("outline"));
      act(() =>
        result.current.token({
          token:
            '{"sections":[{"heading":"Pick your beds"},{"heading":"Map the rows"}]}',
          node: "generate_outline",
        }),
      );
      act(() =>
        result.current.nodeDone("generate_outline", {
          content: { outline: { sections: [{}, {}], target_word_count: 900 } },
        }),
      );
      expect(result.current.findings.headings).toEqual([
        "Pick your beds",
        "Map the rows",
      ]);
      // The user asks for another outline: no phase starts, the model just writes again.
      act(() =>
        result.current.token({
          token: '{"sections":[{"heading":"Choose a sunny spot"}',
          node: "generate_outline",
        }),
      );
      expect(result.current.findings.headings).toEqual(["Choose a sunny spot"]);
    });

    it("keeps the article's searches", () => {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("article"));
      act(() =>
        result.current.custom({ type: "tool_start", id: "1", query: "tea" }),
      );
      act(() => result.current.custom({ type: "tool_end", id: "1", count: 4 }));
      expect(result.current.findings.searches).toEqual([
        { id: "1", query: "tea", done: true, results: 4 },
      ]);
    });
  });
});
