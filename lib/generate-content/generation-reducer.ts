import type {
  ContentOutline,
  PageAction,
  PageState,
  SEORESULT,
  StreamUpdates,
} from "@/types/generate-content";

export const initialState: PageState = {
  step: "keyword",
  userKeyword: "",
  country: "us",
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
  completedNodes: [],
  readabilityScore: null,
  seoScore: null,
  trustScore: null,
  eeatData: null,
  allContent: null,
  currentLoadingSteps: [],
  keywordDifficulty: null,
  activeNode: null,
  streamingPlan: "",
  isEEATProcessed: false,
  isHumanized: false,
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
    case "SET_LOADING_STEPS":
      return { ...state, currentLoadingSteps: action.payload };
    case "SET_LOADING_STATUS":
      return handleLoadingStatus(state, action.payload);
    case "SET_MANUAL_LOADING":
      return { ...state, isManualLoading: action.payload };
    case "CLEAR_COMPLETED_NODES":
      return { ...state, completedNodes: [], activeNode: null };
    case "SET_ACTIVE_NODE":
      return handleActiveNode(state, action.payload);
    case "ADD_COMPLETED_NODE":
      if (state.completedNodes.includes(action.payload)) return state;
      return {
        ...state,
        completedNodes: [...state.completedNodes, action.payload],
      };
    case "SET_STREAMING_CONTENT":
      return { ...state, generatedContent: action.payload };
    case "SET_STREAMING_PLAN":
      return { ...state, streamingPlan: action.payload };
    case "SET_EEAT_PROCESSED":
      return { ...state, isEEATProcessed: action.payload };
    case "SET_HUMANIZED":
      return { ...state, isHumanized: action.payload };
    case "UPDATE_FROM_STREAM":
      return handleStreamUpdate(state, action.payload);
    default:
      return state;
  }
}

function handleActiveNode(state: PageState, nodeId: string): PageState {
  const nextCompleted = [...state.completedNodes];
  if (state.activeNode && state.activeNode !== nodeId) {
    if (!nextCompleted.includes(state.activeNode)) {
      nextCompleted.push(state.activeNode);
    }
  }
  return {
    ...state,
    activeNode: nodeId,
    completedNodes: nextCompleted,
    streamingPlan: "",
  };
}

function handleLoadingStatus(state: PageState, nextStatus: string): PageState {
  return {
    ...state,
    loadingStatus: nextStatus,
  };
}

function handleStreamUpdate(
  state: PageState,
  updates: StreamUpdates,
): PageState {
  if (!updates) return state;
  let changed = false;
  const newState = { ...state };

  /**
   * Helper to extract SEO data into normalized structure
   */
  // biome-ignore lint/suspicious/noExplicitAny: complex recursive stream updates
  const mapSEO = (d: any): SEORESULT | null => {
    if (!d) return null;
    const rawDifficulty = d.keyword_difficulty ?? d.kd;
    const rawVolume = d.search_volume || d.volume;
    const rawIntent = d.main_intent || d.intent;

    // Check if this is a placeholder (all zeros)
    if (
      rawDifficulty === 0 &&
      (rawVolume === 0 || rawVolume === "0") &&
      state.seoResult
    ) {
      // If we already have data, don't overwrite with placeholders
      if (
        (state.seoResult.keyword_difficulty ?? 0) !== 0 ||
        state.seoResult.volume !== "0"
      ) {
        return null;
      }
    }

    return {
      ...state.seoResult,
      keyword_difficulty:
        typeof rawDifficulty === "number"
          ? rawDifficulty
          : (state.seoResult?.keyword_difficulty ?? 0),
      volume: rawVolume?.toString() || (state.seoResult?.volume ?? "0"),
      intent: String(
        rawIntent || state.seoResult?.intent || "informational",
      ).toLowerCase(),
      seo_health_score: state.seoResult?.seo_health_score || 0,
      issue_summary: state.seoResult?.issue_summary || {
        critical: 0,
        errors: 0,
        warnings: 0,
      },
      issues: state.seoResult?.issues || [],
    };
  };

  /**
   * Recursively scan for data and interrupts
   */
  // biome-ignore lint/suspicious/noExplicitAny: complex recursive stream updates
  const processObject = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    // 1. Direct SEO Detection
    const seoData =
      obj.serp_backlinks ||
      obj.seo_state ||
      obj.seo_result?.serp_backlinks ||
      obj.seo_result?.seo_state;
    if (seoData) {
      const mapped = mapSEO(seoData);
      if (
        mapped &&
        JSON.stringify(state.seoResult) !== JSON.stringify(mapped)
      ) {
        newState.seoResult = mapped;
        newState.keywordDifficulty =
          typeof mapped.keyword_difficulty === "number"
            ? mapped.keyword_difficulty
            : null;
        changed = true;
      }
    }

    // 2. Recommendations Detection
    const kwData =
      obj.Recommendations ||
      obj.recommendations ||
      obj.keyword_recommendations?.recommendations;
    if (kwData && Array.isArray(kwData) && kwData.length > 0) {
      if (JSON.stringify(state.suggestedKeywords) !== JSON.stringify(kwData)) {
        newState.suggestedKeywords = kwData;
        newState.primaryKeyword =
          obj["Primary Keyword"] ||
          obj.keyword ||
          obj.primary_keyword ||
          state.primaryKeyword;
        changed = true;
      }
    }

    // 3. Interrupt Detection
    if (obj.__interrupt__ && Array.isArray(obj.__interrupt__)) {
      newState.interrupt = obj.__interrupt__;
      changed = true;

      const val = obj.__interrupt__[0].value;
      if (val) {
        if (val.instruction && state.instruction !== val.instruction) {
          newState.instruction = val.instruction;
          changed = true;
        }

        const type = val.type || val.instruction_type;

        // Phase protection: Don't allow reverting from content to earlier steps
        const PHASE_ORDER: Record<string, number> = {
          keyword: 0,
          "keyword Selection": 1,
          topic: 2,
          content_type: 3,
          outline_review: 4,
          content: 5,
        };

        const currentPhase = PHASE_ORDER[state.instructionType] || 0;
        const newPhase = PHASE_ORDER[type] || 0;

        if (
          type &&
          newPhase >= currentPhase &&
          state.instructionType !== type
        ) {
          newState.instructionType = type;
          changed = true;
        }

        // Deeply process the interrupt value itself for state updates
        processObject(val);
      }
    }

    // 4. Content State detection
    if (obj.topics && Array.isArray(obj.topics)) {
      if (JSON.stringify(state.topics) !== JSON.stringify(obj.topics)) {
        newState.topics = obj.topics;
        changed = true;
      }
    }

    if (obj.content_types && Array.isArray(obj.content_types)) {
      if (
        JSON.stringify(state.contentTypes) !== JSON.stringify(obj.content_types)
      ) {
        newState.contentTypes = obj.content_types;
        changed = true;
      }
    }

    if (obj.type === "outline_review" || obj.outline) {
      const outlineData = obj.data || obj.outline;
      if (
        outlineData &&
        JSON.stringify(state.outline) !== JSON.stringify(outlineData)
      ) {
        newState.outline = outlineData as ContentOutline;
        changed = true;
      }
      if (!["outline", "outline-reject", "content"].includes(state.step)) {
        newState.step = "outline";
        changed = true;
      }
    }

    // Recursion (skip messages to avoid noise)
    for (const key in obj) {
      if (key !== "messages" && typeof obj[key] === "object") {
        processObject(obj[key]);
      }
    }
  };

  processObject(updates);

  return changed ? newState : state;
}
