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
};

export function generationReducer(state: PageState, action: PageAction): PageState {
    switch (action.type) {
        case "SET_INSTRUCTION_TYPE":
            return { ...state, instructionType: action.payload };
        case "SET_USER_KEYWORD":
            return { ...state, userKeyword: action.payload };
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
        case "SET_EEAT_DATA":
            if (state.eeatData === action.payload) return state;
            return { ...state, eeatData: action.payload };
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
            return { ...state, completedNodes: [] };
        case "ADD_COMPLETED_NODE":
            if (state.completedNodes.includes(action.payload)) return state;
            return {
                ...state,
                completedNodes: [...state.completedNodes, action.payload],
            };
        case "UPDATE_FROM_STREAM":
            return handleStreamUpdate(state, action.payload);
        default:
            return state;
    }
}

function handleLoadingStatus(state: PageState, nextStatus: string): PageState {
    const prevStatus = state.loadingStatus;
    const nextCompleted = [...state.completedNodes];
    if (prevStatus?.endsWith("...") && prevStatus !== nextStatus) {
        const finishedNode = prevStatus.slice(0, -3);
        if (!nextCompleted.includes(finishedNode)) {
            nextCompleted.push(finishedNode);
        }
    }
    return {
        ...state,
        loadingStatus: nextStatus,
        completedNodes: nextCompleted,
    };
}

function handleStreamUpdate(state: PageState, updates: StreamUpdates): PageState {
    let changed = false;
    const newState = { ...state };

    const interrupt = updates.__interrupt__;

    if (interrupt && interrupt.length > 0) {
        const interruptValue = interrupt[0].value;
        const newInstruction = (interruptValue.instruction || interruptValue.instructions) as string | undefined;
        const newInstructionType = (interruptValue.instruction_type || interruptValue.type) as string | undefined;

        if (newInstruction !== undefined && state.instruction !== newInstruction) {
            newState.instruction = newInstruction;
            changed = true;
        }
        if (newInstructionType !== undefined && state.instructionType !== newInstructionType) {
            newState.instructionType = newInstructionType;
            changed = true;
        }

        if (interruptValue.Recommendations) {
            const keywords = interruptValue.Recommendations as string[];
            const primaryKeyword = interruptValue["Primary Keyword"] as string | undefined;
            if (keywords && keywords.length > 0) {
                if (JSON.stringify(state.suggestedKeywords) !== JSON.stringify(keywords)) {
                    newState.primaryKeyword = primaryKeyword || "";
                    newState.suggestedKeywords = keywords;
                    if (interruptValue.seo_state) {
                        newState.seoResult = interruptValue.seo_state;
                    }
                    changed = true;
                }
                if (state.step === "keyword") {
                    newState.step = "suggestions";
                    changed = true;
                }
            }
        } else if (interruptValue.topics) {
            const newTopics = interruptValue.topics as string[];
            if (JSON.stringify(state.topics) !== JSON.stringify(newTopics)) {
                newState.topics = newTopics;
                changed = true;
            }
        } else if (interruptValue.content_types) {
            const newContentTypes = interruptValue.content_types as string[];
            if (JSON.stringify(state.contentTypes) !== JSON.stringify(newContentTypes)) {
                newState.contentTypes = newContentTypes;
                changed = true;
            }
        } else if (interruptValue.type === "outline_review") {
            const newOutline = interruptValue.data as ContentOutline;
            if (JSON.stringify(state.outline) !== JSON.stringify(newOutline)) {
                newState.outline = newOutline;
                changed = true;
            }
            if (state.step !== "outline" && state.step !== "outline-reject" && state.step !== "content") {
                newState.step = "outline";
                changed = true;
            }
        }
    }

    return changed ? newState : state;
}