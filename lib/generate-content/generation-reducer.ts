import type {
  ContentOutline,
  PageAction,
  PageState,
  StreamUpdates,
} from "@/types/generate-content";

export const initialState: PageState = {
  step: "keyword",
  userKeyword: "",
  country: "us",
  analyzedCountry: "",
  analyzedKeyword: "",
  primaryKeyword: "",
  suggestedKeywords: [],
  generatedContent: "",
  threadId: null,
  rejectedReason: "",
  outline: null,
  isLoading: false,
  topics: [],
  instruction: "",
  instructionType: "keyword",
  isEditing: false,
  seoResult: null,
  serp: null,
  competitors: null,
  currentContentState: null,
  interrupt: null,
  contentTypes: [],
  loadingStatus: "",
  isManualLoading: false,
  readabilityScore: null,
  checklist: null,
  seoScore: null,
  trustScore: null,
  eeatData: null,
  allContent: null,
  run: null,
  keywordDifficulty: null,
  keywordClusters: [],
  recommendedContentType: null,
  recommendedTopic: null,
  selectedContentType: null,
  selectedTopic: null,
};

export function generationReducer(
  state: PageState,
  action: PageAction,
): PageState {
  switch (action.type) {
    case "SET_INSTRUCTION_TYPE":
      return { ...state, instructionType: action.payload };
    case "SET_USER_KEYWORD":
      return { ...state, userKeyword: action.payload };
    case "SET_PRIMARY_KEYWORD":
      return { ...state, primaryKeyword: action.payload };
    case "SET_COUNTRY":
      return { ...state, country: action.payload };
    case "SET_THREAD_ID":
      if (state.threadId === action.payload) return state;
      return { ...state, threadId: action.payload };
    case "SET_REJECTED_REASON":
      if (state.rejectedReason === action.payload) return state;
      return { ...state, rejectedReason: action.payload };
    case "SET_IS_EDITING":
      if (state.isEditing === action.payload) return state;
      return { ...state, isEditing: action.payload };
    case "SET_GENERATED_CONTENT":
      if (state.generatedContent === action.payload) return state;
      return { ...state, generatedContent: action.payload };
    case "SET_ALL_CONTENT":
      if (state.allContent === action.payload) return state;
      return { ...state, allContent: action.payload };
    case "SET_READABILITY_SCORE":
      if (state.readabilityScore === action.payload) return state;
      return { ...state, readabilityScore: action.payload };
    case "SET_CHECKLIST":
      if (state.checklist === action.payload) return state;
      return { ...state, checklist: action.payload };
    case "SET_TRUST_SCORE":
      if (state.trustScore === action.payload) return state;
      return { ...state, trustScore: action.payload };
    case "SET_SEO_SCORE":
      if (state.seoScore === action.payload) return state;
      return { ...state, seoScore: action.payload };
    case "RESET_FOR_REJECT":
      return { ...state, instruction: "", step: "outline-reject" };
    case "SUBMIT_REJECT_REASON":
      return { ...state, step: "outline", rejectedReason: "", outline: null };
    case "SET_INTERRUPT":
      return { ...state, interrupt: action.payload };
    case "SET_RECOMMENDED_CONTENT_TYPE":
      return { ...state, recommendedContentType: action.payload };
    case "SET_SELECTED_CONTENT_TYPE":
      if (state.selectedContentType === action.payload) return state;
      return { ...state, selectedContentType: action.payload };
    case "SET_RECOMMENDED_TOPIC":
      return { ...state, recommendedTopic: action.payload };
    case "SET_SELECTED_TOPIC":
      return { ...state, selectedTopic: action.payload };
    case "SET_TOPICS":
      return { ...state, topics: action.payload };
    case "SET_OUTLINE":
      return { ...state, outline: action.payload };
    case "SET_KEYWORD_DIFFICULTY":
      return {
        ...state,
        keywordDifficulty: action.payload,
        instructionType:
          state.instructionType === "keyword"
            ? "keyword Selection"
            : state.instructionType,
      };
    case "SET_KEYWORD_CLUSTERS":
      return { ...state, keywordClusters: action.payload };
    case "SET_RUN_PHASE":
      return {
        ...state,
        run: action.payload
          ? {
              phase: action.payload.phase,
              joined: action.payload.joined ?? false,
              stageId: action.payload.stageId,
              seq: (state.run?.seq ?? 0) + 1,
            }
          : null,
      };
    case "SET_LOADING_STATUS":
      return handleLoadingStatus(state, action.payload);
    case "SET_MANUAL_LOADING":
      return { ...state, isManualLoading: action.payload };
    case "RESET_FOR_THREAD_SWITCH":
      // Clear all content-related state so a previously-viewed thread's final
      // article / scores / outline don't bleed into the new thread's view.
      return {
        ...initialState,
        // Preserve the threadId — SET_THREAD_ID is dispatched separately.
        threadId: state.threadId,
        // Preserve keyword/country so they can be restored from the new thread.
        userKeyword: state.userKeyword,
        country: state.country,
      };
    case "RESET_FOR_REANALYSIS":
      // A keyword + country analysis is self-contained: when either changes,
      // nothing derived from the previous pair (recommendations, metrics,
      // clusters, later-step data) may remain visible or be diffed against the
      // new result. The inputs themselves and the thread are kept.
      return {
        ...state,
        analyzedCountry: "",
        analyzedKeyword: "",
        suggestedKeywords: [],
        seoResult: null,
        serp: null,
        competitors: null,
        keywordClusters: [],
        keywordDifficulty: null,
        interrupt: null,
        topics: [],
        contentTypes: [],
        outline: null,
        recommendedContentType: null,
        recommendedTopic: null,
        selectedContentType: null,
        selectedTopic: null,
      };
    case "UPDATE_FROM_STREAM":
      return handleStreamUpdate(state, action.payload);
    default:
      return state;
  }
}

function handleLoadingStatus(state: PageState, nextStatus: string): PageState {
  return { ...state, loadingStatus: nextStatus };
}

function handleStreamUpdate(
  state: PageState,
  updates: StreamUpdates,
): PageState {
  let changed = false;
  const newState = { ...state };

  const interrupt = updates.__interrupt__;

  if (interrupt && interrupt.length > 0) {
    const interruptValue = interrupt[0].value;
    const newInstruction = (interruptValue.instruction ||
      interruptValue.instructions) as string | undefined;
    const newInstructionType = (interruptValue.instruction_type ||
      interruptValue.type) as string | undefined;

    if (newInstruction !== undefined && state.instruction !== newInstruction) {
      newState.instruction = newInstruction;
      changed = true;
    }
    if (
      newInstructionType !== undefined &&
      state.instructionType !== newInstructionType
    ) {
      newState.instructionType = newInstructionType;
      changed = true;
    }

    if (interruptValue.Recommendations) {
      const keywords = interruptValue.Recommendations as string[];
      const primaryKeyword = interruptValue["Primary Keyword"] as
        | string
        | undefined;
      if (keywords && keywords.length > 0) {
        // Re-analysing a related keyword ("x" → "x plugin") often returns the
        // same related-topics list, so the recommendations are not a proxy for
        // "nothing changed" — the keyword and its metrics refresh on their own.
        if (
          JSON.stringify(state.suggestedKeywords) !== JSON.stringify(keywords)
        ) {
          newState.suggestedKeywords = keywords;
          changed = true;
        }
        if (primaryKeyword && state.primaryKeyword !== primaryKeyword) {
          newState.primaryKeyword = primaryKeyword;
          changed = true;
        }
        if (primaryKeyword && state.analyzedKeyword !== primaryKeyword) {
          newState.analyzedKeyword = primaryKeyword;
          changed = true;
        }
        const analyzedCountry = interruptValue.Country;
        if (
          typeof analyzedCountry === "string" &&
          state.analyzedCountry !== analyzedCountry
        ) {
          newState.analyzedCountry = analyzedCountry;
          changed = true;
        }
        if (
          interruptValue.seo_state &&
          JSON.stringify(state.seoResult) !==
            JSON.stringify(interruptValue.seo_state)
        ) {
          newState.seoResult = interruptValue.seo_state;
          changed = true;
        }
        const clusters = interruptValue["Keyword Clusters"];
        if (
          Array.isArray(clusters) &&
          clusters.length > 0 &&
          JSON.stringify(state.keywordClusters) !== JSON.stringify(clusters)
        ) {
          newState.keywordClusters =
            clusters as import("@/types/generate-content").KeywordCluster[];
          changed = true;
        }
        if (state.step === "keyword") {
          newState.step = "suggestions";
          changed = true;
        }
      }
    } else if (
      interruptValue.topics ||
      newInstructionType === "topic_selection"
    ) {
      const newTopics = (interruptValue.topics as string[]) || [];
      newState.topics = newTopics;
      changed = true;
    } else if (interruptValue.content_types) {
      const newContentTypes = interruptValue.content_types as string[];
      if (
        JSON.stringify(state.contentTypes) !== JSON.stringify(newContentTypes)
      ) {
        newState.contentTypes = newContentTypes;
        changed = true;
      }
    } else if (interruptValue.type === "outline_review") {
      const outlineData = (interruptValue.outline_dict ||
        interruptValue.data) as ContentOutline;
      if (outlineData) {
        const clusterHeadingMap =
          outlineData.cluster_heading_map ||
          (interruptValue.outline_dict as Record<string, unknown>)
            ?.cluster_heading_map ||
          (interruptValue.data as Record<string, unknown>)?.cluster_heading_map;

        let normalizedMap: import("@/types/generate-content").ClusterHeadingMapItem[] =
          [];
        if (clusterHeadingMap) {
          if (Array.isArray(clusterHeadingMap)) {
            normalizedMap = clusterHeadingMap;
          } else if (typeof clusterHeadingMap === "object") {
            const sections = outlineData.sections || [];
            const sectionHeadings = new Set(
              sections.map((s) => s.heading.toLowerCase().trim()),
            );

            normalizedMap = Object.entries(clusterHeadingMap).flatMap(
              ([key, val]) => {
                if (Array.isArray(val)) {
                  return val.map((heading) => ({
                    cluster: key,
                    heading: String(heading),
                  }));
                } else if (typeof val === "string") {
                  const kNorm = key.toLowerCase().trim();
                  const vNorm = val.toLowerCase().trim();
                  if (sectionHeadings.has(kNorm)) {
                    return [{ heading: key, cluster: val }];
                  } else if (sectionHeadings.has(vNorm)) {
                    return [{ heading: val, cluster: key }];
                  } else {
                    return [{ heading: key, cluster: val }];
                  }
                }
                return [];
              },
            );
          }
        }

        const newOutline = {
          ...outlineData,
          cluster_heading_map: normalizedMap,
        };

        if (JSON.stringify(state.outline) !== JSON.stringify(newOutline)) {
          newState.outline = newOutline;
          changed = true;
        }
      }

      const rawClusters =
        interruptValue.clusters ||
        interruptValue.keyword_clusters ||
        interruptValue["Keyword Clusters"] ||
        (interruptValue.outline_dict as Record<string, unknown>)?.clusters ||
        (interruptValue.outline_dict as Record<string, unknown>)
          ?.keyword_clusters ||
        (interruptValue.outline_dict as Record<string, unknown>)?.[
          "Keyword Clusters"
        ];
      if (Array.isArray(rawClusters)) {
        if (
          JSON.stringify(state.keywordClusters) !== JSON.stringify(rawClusters)
        ) {
          newState.keywordClusters =
            rawClusters as import("@/types/generate-content").KeywordCluster[];
          changed = true;
        }
      }

      if (
        state.step !== "outline" &&
        state.step !== "outline-reject" &&
        state.step !== "content"
      ) {
        newState.step = "outline";
        changed = true;
      }
    }
  }

  return changed ? newState : state;
}
