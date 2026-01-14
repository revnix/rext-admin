import type { Message } from "@langchain/langgraph-sdk";

export type NormalizedOrganicResult = {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  date?: string;
  has_sitelinks: boolean;
};

export type SERPNormalized = {
  query: string;
  engine: string;
  normalize_results: NormalizedOrganicResult[];
  related_topics: string[];
  questions: string[];
  stats: Record<string, number>;
  domains: string[];
  domain_stats: Record<string, unknown>;
  freshness: Record<string, unknown>;
  features: Record<string, boolean>;
};

export type OutlineSection = {
  heading: string;
  description: string;
  key_points: string[];
  suggested_word_count: number;
};

export type Outline = {
  title: string;
  brief: string;
  sections: OutlineSection[];
  tone: string;
  target_audience: string[];
};

export type Content = {
  title: string;
  content: string;
  tags: string[];
  final_content: FinalContent;
  review: Review;
};

export type FinalContent = {
  title: string;
  content: string;
  tags: string[];
  body_markdown: string;
  meta_title?: string;
  meta_description?: string;
};

export type Review = {
  readability_metrics: ReadabilityMetrics;
};

export type ReadabilityMetrics = {
  flesch_reading_ease: number;
};

export type ReadabilityMeta = {
  label: string;
  color: string;
  barColor: string;
};

export type WREXT = {
  messages: Message[];
  serp_payload: {
    query: string;
    country: string;
  };
  serp_result: {
    organic_results: Array<Record<string, unknown>>;
    related_searches: string[];
    people_ask: Array<Record<string, unknown>>;
    search_information: Record<string, unknown>;
    total_results: number;
  };
  serp_normalized: SERPNormalized;
  competitors: Array<{
    domain: string;
    top_positions: number[];
    total_occurrences: number;
    has_sitelinks: boolean;
    intent_distribution: Record<string, number>;
    freshness: Record<string, number>;
    avg_snippet_length: number;
    featured_snippet: boolean;
    is_brand: boolean;
  }>;
  scrape_context: {
    documents: Array<{
      document: unknown;
      content_length: number;
      keywords: string[];
      headings: string[];
    }>;
    total_documents: number;
  };
  relevant_context: unknown[];
  seo_result: unknown;
  content: Content;
  outline?: Outline;
  final_content?: FinalContent;
  topics?: string[];
  status?: string;
  rejected_reason?: string;
  instruction_response?: string;
  "Selected Topic"?: string;
  "Primary Keyword"?: string;
  Recommendations?: string[];
  continue_workflow?: boolean;
  __interrupt__?: Array<{
    id: string;
    value: {
      instructions: string;
      instruction: string;
      type: string;
      "Primary Keyword": string;
      Recommendations: string[];
      [key: string]: unknown;
    };
  }>;
};

export type AppStep =
  | "keyword"
  | "suggestions"
  | "topics"
  | "outline"
  | "outline-reject"
  | "content";

export interface PageState {
  step: AppStep;
  userKeyword: string;
  country: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  generatedContent: string;
  threadId: string | null;
  rejectedReason: string;
  outline: Outline | null;
  topics: string[];
  instruction: string;
  instructionType: string;
  isEditing: boolean;
}

export type PageAction =
  | { type: "SET_STEP"; payload: AppStep }
  | { type: "SET_USER_KEYWORD"; payload: string }
  | { type: "SET_COUNTRY"; payload: string }
  | { type: "SET_THREAD_ID"; payload: string | null }
  | { type: "SET_REJECTED_REASON"; payload: string }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_GENERATED_CONTENT"; payload: string }
  | { type: "UPDATE_FROM_STREAM"; payload: WREXT }
  | { type: "RESET_FOR_REJECT" }
  | { type: "SUBMIT_REJECT_REASON" };
