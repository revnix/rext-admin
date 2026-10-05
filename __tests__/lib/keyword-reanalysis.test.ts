import { isKeywordReanalysis } from "@/lib/generate-content/keyword-reanalysis";
import {
  generationReducer,
  initialState,
} from "@/lib/generate-content/generation-reducer";
import type {
  KeywordCluster,
  PageState,
  StreamUpdates,
} from "@/types/generate-content";

const analysis = (
  keyword: string,
  country: string,
  overrides: Record<string, unknown> = {},
): StreamUpdates =>
  ({
    __interrupt__: [
      {
        value: {
          instruction: "Select a keyword for your content",
          type: "keyword Selection",
          "Primary Keyword": keyword,
          Country: country,
          Recommendations: [
            `${keyword} ${country} one`,
            `${keyword} ${country} two`,
          ],
          "Keyword Clusters": [{ name: `${keyword} cluster` }],
          seo_state: { volume: `${keyword.length * 100}` },
          ...overrides,
        },
      },
    ],
  }) as unknown as StreamUpdates;

const apply = (state: PageState, updates: StreamUpdates) =>
  generationReducer(state, { type: "UPDATE_FROM_STREAM", payload: updates });

/** What the view does when the user re-submits at the keyword step. */
const reanalyse = (state: PageState, keyword: string, country: string) =>
  generationReducer(
    generationReducer(
      generationReducer(state, { type: "RESET_FOR_REANALYSIS" }),
      { type: "SET_USER_KEYWORD", payload: keyword },
    ),
    { type: "SET_COUNTRY", payload: country },
  );

describe("isKeywordReanalysis", () => {
  const base = {
    primaryKeyword: "keyword a",
    country: "us",
    analyzedCountry: "us",
  };

  it("is false for the keyword and country already analysed", () => {
    expect(isKeywordReanalysis({ ...base, value: "keyword a" })).toBe(false);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(
      isKeywordReanalysis({
        ...base,
        value: "  Keyword A ",
        country: "US",
      }),
    ).toBe(false);
  });

  it("is true for a different keyword", () => {
    expect(isKeywordReanalysis({ ...base, value: "keyword b" })).toBe(true);
  });

  it("is true for the same keyword in a different country", () => {
    expect(
      isKeywordReanalysis({ ...base, value: "keyword a", country: "gb" }),
    ).toBe(true);
  });

  it("compares only the keyword while the analysed country is unknown", () => {
    expect(
      isKeywordReanalysis({
        ...base,
        value: "keyword a",
        country: "gb",
        analyzedCountry: "",
      }),
    ).toBe(false);
    expect(
      isKeywordReanalysis({
        ...base,
        value: "keyword b",
        analyzedCountry: undefined,
      }),
    ).toBe(true);
  });
});

describe("keyword analysis state", () => {
  const analysedA = () => apply(initialState, analysis("keyword a", "us"));

  it("records the analysed keyword, country, recommendations and clusters", () => {
    const state = analysedA();

    expect(state.primaryKeyword).toBe("keyword a");
    expect(state.analyzedCountry).toBe("us");
    expect(state.suggestedKeywords).toEqual([
      "keyword a us one",
      "keyword a us two",
    ]);
    expect(state.keywordClusters).toHaveLength(1);
    expect(state.seoResult?.volume).toBe("900");
  });

  it("keyword A -> keyword B: the previous analysis is cleared immediately", () => {
    const state = reanalyse(analysedA(), "keyword b", "us");

    expect(state.suggestedKeywords).toEqual([]);
    expect(state.seoResult).toBeNull();
    expect(state.keywordClusters).toEqual([]);
    expect(state.keywordDifficulty).toBeNull();
    expect(state.userKeyword).toBe("keyword b");
  });

  it("keyword A -> keyword B: recommendations belong to keyword B", () => {
    const state = apply(
      reanalyse(analysedA(), "keyword b", "us"),
      analysis("keyword b", "us"),
    );

    expect(state.primaryKeyword).toBe("keyword b");
    expect(state.suggestedKeywords).toEqual([
      "keyword b us one",
      "keyword b us two",
    ]);
    expect(
      state.suggestedKeywords.some((keyword) => keyword.includes("keyword a")),
    ).toBe(false);
    expect(state.seoResult?.volume).toBe("900");
    expect(
      (state.keywordClusters[0] as KeywordCluster & { name: string }).name,
    ).toBe("keyword b cluster");
  });

  it("same keyword, country A -> country B: replaces data and records the new country", () => {
    const state = apply(
      reanalyse(analysedA(), "keyword a", "gb"),
      analysis("keyword a", "gb"),
    );

    expect(state.primaryKeyword).toBe("keyword a");
    expect(state.analyzedCountry).toBe("gb");
    expect(state.country).toBe("gb");
    expect(state.suggestedKeywords).toEqual([
      "keyword a gb one",
      "keyword a gb two",
    ]);
  });

  it("a re-analysis whose related topics are identical still refreshes metrics", () => {
    const first = apply(
      initialState,
      analysis("keyword a", "us", { Recommendations: ["shared topic"] }),
    );
    const second = apply(
      reanalyse(first, "keyword b", "us"),
      analysis("keyword b", "us", {
        Recommendations: ["shared topic"],
        seo_state: { volume: "42" },
      }),
    );

    expect(second.primaryKeyword).toBe("keyword b");
    expect(second.seoResult?.volume).toBe("42");
  });

  it("repeating the same keyword and country does not change the state", () => {
    const state = analysedA();

    expect(apply(state, analysis("keyword a", "us"))).toBe(state);
  });

  it("the reset keeps the user's inputs and thread", () => {
    const state = reanalyse(
      generationReducer(analysedA(), { type: "SET_THREAD_ID", payload: "t-1" }),
      "keyword b",
      "gb",
    );

    expect(state.threadId).toBe("t-1");
    expect(state.userKeyword).toBe("keyword b");
    expect(state.country).toBe("gb");
  });

  it("a later-step answer is dropped when the analysis restarts", () => {
    const withLaterSteps: PageState = {
      ...analysedA(),
      topics: ["old title"],
      contentTypes: ["blog"],
      selectedContentType: "blog",
      recommendedTopic: "old title",
    };

    const state = generationReducer(withLaterSteps, {
      type: "RESET_FOR_REANALYSIS",
    });

    expect(state.topics).toEqual([]);
    expect(state.contentTypes).toEqual([]);
    expect(state.selectedContentType).toBeNull();
    expect(state.recommendedTopic).toBeNull();
  });
});
