import {
  generationReducer,
  initialState,
} from "@/lib/generate-content/generation-reducer";
import { startStages } from "@/lib/generate-content/run-stages";
import {
  currentStepIndex,
  showsSteps,
  runningStage,
  stepChoices,
  WORKFLOW_STEPS,
} from "@/lib/generate-content/workflow-steps";
import type {
  ContentOutline,
  FinalContent,
  PageAction,
  PageState,
  StreamUpdates,
} from "@/types/generate-content";

const reduce = (state: PageState, ...actions: PageAction[]) =>
  actions.reduce(generationReducer, state);

/** The keyword gate as the analysis of `keyword` sends it. */
const keywordGate = (keyword: string): PageAction => ({
  type: "UPDATE_FROM_STREAM",
  payload: {
    __interrupt__: [
      {
        value: {
          type: "keyword Selection",
          "Primary Keyword": keyword,
          Country: "us",
          Recommendations: [`${keyword} ideas`, `vegetable ${keyword}`],
        },
      },
    ],
  } as unknown as StreamUpdates,
});

describe("the steps", () => {
  it("are six, named in sentence case", () => {
    expect(WORKFLOW_STEPS.map((step) => step.label)).toEqual([
      "Search keyword",
      "Select keyword",
      "Content type",
      "Title",
      "Content outline",
      "Article",
    ]);
  });
});

describe("currentStepIndex", () => {
  it("is the step on screen, by its instruction type or another name for it", () => {
    expect(currentStepIndex("keyword")).toBe(0);
    expect(currentStepIndex("keyword Selection")).toBe(1);
    expect(currentStepIndex("content_type")).toBe(2);
    expect(currentStepIndex("topic")).toBe(3);
    expect(currentStepIndex("topic_selection")).toBe(3);
    expect(currentStepIndex("outline_review")).toBe(4);
    expect(currentStepIndex("outline_reject")).toBe(4);
    expect(currentStepIndex("content")).toBe(5);
  });

  it("is the last step for an instruction type no step names", () => {
    expect(currentStepIndex("something else")).toBe(5);
  });

  it("is the step the run prepares while the page waits on it", () => {
    // The search is sent and the analysis runs: step 1 is done, the keywords to pick come next.
    expect(currentStepIndex("keyword", "analysis")).toBe(1);
    expect(currentStepIndex("keyword Selection", "content-type")).toBe(2);
    expect(currentStepIndex("content_type", "titles")).toBe(3);
    expect(currentStepIndex("topic", "outline")).toBe(4);
    expect(currentStepIndex("outline_review", "article")).toBe(5);
    // Regenerating the titles keeps the Title step current.
    expect(currentStepIndex("topic", "titles")).toBe(3);
    expect(currentStepIndex("topic", null)).toBe(3);
  });
});

describe("showsSteps (FB3.1: the six steps are not shown on the Article step)", () => {
  it("shows them on steps 1 to 5", () => {
    for (const type of [
      "keyword",
      "keyword Selection",
      "content_type",
      "topic",
      "topic_selection",
      "outline_review",
      "outline_reject",
    ]) {
      expect(showsSteps(type)).toBe(true);
    }
  });

  it("shows them on the wait before each of those steps", () => {
    expect(showsSteps("keyword", "analysis")).toBe(true);
    expect(showsSteps("keyword Selection", "content-type")).toBe(true);
    expect(showsSteps("content_type", "titles")).toBe(true);
    expect(showsSteps("topic", "outline")).toBe(true);
    expect(showsSteps("outline_review", "outline")).toBe(true);
  });

  it("doesn't show them on the article's page", () => {
    expect(showsSteps("content")).toBe(false);
    expect(showsSteps("content", null)).toBe(false);
  });

  it("doesn't show them while the article is written, whatever step the page last named", () => {
    // The approved outline's own update names the outline step again until the draft's first words.
    expect(showsSteps("outline_review", "article")).toBe(false);
    expect(showsSteps("content", "article")).toBe(false);
  });
});

describe("runningStage", () => {
  const titles = { phase: "titles" as const, stages: startStages("titles", 1) };

  it("is the active stage of the run preparing the current step", () => {
    expect(runningStage(titles, 3)?.label).toBe("Writing five titles");
  });

  it("is nothing for another step, with no run, or once the run's stages are done", () => {
    expect(runningStage(titles, 2)).toBeUndefined();
    expect(runningStage(null, 3)).toBeUndefined();
    expect(
      runningStage(
        {
          phase: "titles",
          stages: titles.stages.map((stage) => ({
            ...stage,
            state: "complete" as const,
          })),
        },
        3,
      ),
    ).toBeUndefined();
  });
});

describe("stepChoices", () => {
  it("has nothing to say before the search", () => {
    expect(stepChoices(initialState)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("names the keyword typed while its analysis runs", () => {
    const state = reduce(
      initialState,
      { type: "RESET_FOR_REANALYSIS" },
      { type: "SET_USER_KEYWORD", payload: "garden planner" },
    );

    expect(stepChoices(state)[0]).toBe("garden planner");
  });

  it("names the keyword a run from the Library started with, until its analysis answers", () => {
    // The state holds no keyword yet: the view starts the run with the Library's own.
    expect(stepChoices(initialState, "raised bed layout")[0]).toBe(
      "raised bed layout",
    );

    const typed = reduce(initialState, {
      type: "SET_USER_KEYWORD",
      payload: "garden planner",
    });
    expect(stepChoices(typed, "raised bed layout")[0]).toBe("garden planner");
  });

  it("keeps the keyword searched apart from the one picked", () => {
    const analysed = reduce(
      initialState,
      { type: "SET_USER_KEYWORD", payload: "garden planner" },
      keywordGate("garden planner"),
    );
    expect(analysed.analyzedKeyword).toBe("garden planner");

    // What the view does when a suggestion is picked: both keywords move to it.
    const picked = reduce(
      analysed,
      { type: "SET_USER_KEYWORD", payload: "vegetable garden planner" },
      { type: "SET_PRIMARY_KEYWORD", payload: "vegetable garden planner" },
    );

    expect(stepChoices(picked).slice(0, 2)).toEqual([
      "garden planner",
      "vegetable garden planner",
    ]);
  });

  it("names the content type in words and the title as chosen", () => {
    const state = reduce(
      initialState,
      { type: "SET_SELECTED_CONTENT_TYPE", payload: "how-to-guide" },
      { type: "SET_SELECTED_TOPIC", payload: "How to Plan a Vegetable Garden" },
    );

    expect(stepChoices(state).slice(2)).toEqual([
      "How-to guide",
      "How to Plan a Vegetable Garden",
    ]);
  });

  it("says the title chosen on a reopened run, not the article's, which may have been edited", () => {
    const state = reduce(initialState, {
      type: "SET_SELECTED_TOPIC",
      payload: "The title chosen",
    });

    expect(
      stepChoices({
        ...state,
        outline: { title: "The outline's title" } as ContentOutline,
        allContent: { title: "An edited title" } as FinalContent,
      })[3],
    ).toBe("The title chosen");
  });

  it("reads a restored run's title from its outline, then from its article", () => {
    const outline = { title: "The outline's title" } as ContentOutline;
    expect(stepChoices({ ...initialState, outline })[3]).toBe(
      "The outline's title",
    );
    expect(
      stepChoices({
        ...initialState,
        allContent: { title: "The article's title" } as FinalContent,
      })[3],
    ).toBe("The article's title");
  });

  it("drops the earlier choices when the keyword is analysed again", () => {
    const state = reduce(
      initialState,
      keywordGate("garden planner"),
      { type: "SET_SELECTED_TOPIC", payload: "An old title" },
      { type: "RESET_FOR_REANALYSIS" },
      { type: "SET_USER_KEYWORD", payload: "balcony garden" },
    );

    expect(state.analyzedKeyword).toBe("");
    expect(state.selectedTopic).toBeNull();
    expect(stepChoices(state)[0]).toBe("balcony garden");
    expect(reduce(state, keywordGate("balcony garden")).analyzedKeyword).toBe(
      "balcony garden",
    );
  });

  it("drops them when another article's thread is opened", () => {
    const state = reduce(
      initialState,
      keywordGate("garden planner"),
      { type: "SET_SELECTED_TOPIC", payload: "An old title" },
      { type: "RESET_FOR_THREAD_SWITCH" },
    );

    expect(state.analyzedKeyword).toBe("");
    expect(state.selectedTopic).toBeNull();
  });
});
