import type { Message } from "@langchain/langgraph-sdk";
import type { LoadingStep } from "@/constants/loading-steps";

export type Interrupt = {
  id: string;
  value: {
    instructions?: string;
    instruction?: string;
    type: string;
    topics?: string[];
    data?: ContentOutline;
    Recommendations?: string[];
    seo_state?: SEORESULT;
    "Primary Keyword"?: string;
    [key: string]: unknown;
  };
};

export type ReadabilityMeta = {
  label: string;
  color: string;
  barColor: string;
};

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

export type ContentFact = {
  text: string;
};

// ── Section item sub-types (content types that don't use key_points) ──────────

export type ChecklistItem = {
  label: string;
  context?: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export type FAQItem = {
  question: string;
  answer_brief: string;
  detailed_answer?: string;
};

export type GlossaryEntry = {
  term: string;
  definition: string;
  examples?: string[];
  related_terms?: string[];
};

export type ResourceItem = {
  title: string;
  url?: string;
  description: string;
  category?: string;
  pros?: string[];
};

export type TutorialStep = {
  title: string;
  description: string;
  code_suggestions?: Array<{
    language: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
  }>;
};

export type HowToStep = {
  title: string;
  description: string;
  tools_needed?: string[];
};

export type ResearchFinding = {
  topic: string;
  data_points: string[];
  implication: string;
};

export type CaseStudyResultMetric = {
  metric_name: string;
  result_value: string;
  context?: string;
};

export type KeyConcept = {
  term: string;
  definition: string;
  examples?: string[];
};

// ── ContentSection covers all backend section variants ────────────────────────
export type ContentSection = {
  heading: string;
  heading_level?: "H2" | "H3";
  description: string;
  suggested_word_count?: number;

  // Blog / HowTo(section) / Explainer / Pillar / commercial
  key_points?: string[];
  questions_to_answer?: string[];
  snippet_target?: boolean;
  search_intent?:
    | "informational"
    | "commercial"
    | "navigational"
    | "transactional";
  include_keyphrase_in_heading?: boolean;
  facts?: ContentFact[];
  concepts?: KeyConcept[]; // ExplainerSection
  subtopic_cluster?: string[]; // PillarSection
  comparison_criteria?: string[]; // ComparisonSection
  pros?: string[]; // ProsConsSection
  cons?: string[]; // ProsConsSection
  product_feature?: string; // InDepthReviewSection
  rating?: number; // InDepthReviewSection
  tier_name?: string; // PricingTierSection
  price_point?: string;
  target_user?: string;

  // Checklist sections
  items?: ChecklistItem[];

  // FAQ sections (backend key is also "items")
  items_faq?: FAQItem[];

  // Glossary sections
  entries?: GlossaryEntry[];

  // Resource list sections
  resources?: ResourceItem[];

  // Tutorial sections
  steps?: TutorialStep[];

  // HowTo sections (backend key is also "steps")
  steps_howto?: HowToStep[];

  // White paper sections
  findings?: ResearchFinding[];

  // Case study sections
  key_highlights?: string[];
  results?: CaseStudyResultMetric[];
};

export type ContentImageSuggestion = {
  description: string;
  alt_text_template: string;
  section: string;
};

export type ContentLinkSuggestion = {
  anchor_text: string;
  link_type: "internal" | "outbound";
  context: string;
  section: string;
};

export type ContentOutline = {
  title: string | undefined;
  slug_suggestion?: string;
  brief: string | undefined;
  focus_keyphrase?: string;
  keywords_to_include: string[];
  sections: ContentSection[];
  faqs?: string[];
  key_facts?: ContentFact[];
  image_suggestions?: ContentImageSuggestion[];
  link_suggestions?: ContentLinkSuggestion[];
  schema_type?:
    | "Article"
    | "HowTo"
    | "FAQPage"
    | "BlogPosting"
    | "Product"
    | "Review"
    | "DefinedTermSet"
    | "ItemList"
    | "WebPage"
    | "TechArticle"
    | "NewsArticle"
    | "ScholarlyArticle"
    | "WhitePaper";
  target_audience: string[];
  tone: string;
  target_word_count?: number;
  status: "approved" | "rejected" | "reviewing";
  rejected_reason?: string;

  // ── Informational type-specific ───────────────────────────────────────────
  total_time?: string; // HowToGuide, Checklist
  difficulty?: "Beginner" | "Intermediate" | "Advanced"; // HowToGuide, Tutorial
  tools_needed?: string[]; // HowToGuide
  environment_setup?: string; // Tutorial
  total_items?: number; // Checklist
  estimated_time?: string; // Checklist
  contact_instruction?: string; // FAQ
  alphabetical_navigation?: boolean; // Glossary
  selection_criteria?: string; // ResourceList
  methodology?: string; // WhitePaper
  client?: string; // CaseStudy
  related_clusters?: string[]; // PillarContent

  // ── Commercial type-specific ──────────────────────────────────────────────
  compared_entities?: string[];
  winner_declaration?: boolean;
  comparison_table_included?: boolean;
  product_name?: string;
  manufacturer?: string;
  overall_rating?: number;
  verdict?: string;
  entity_name?: string;
  overall_sentiment?: string;
  final_recommendation?: string;
  category_name?: string;
  total_tools_to_list?: number;
  ranking_criteria?: string[];
  top_pick_declaration?: boolean;
  total_products?: number;
  roundup_theme?: string;
  best_value_pick?: string;
  premium_pick?: string;
  primary_entity?: string;
  reasons_for_alternatives?: string[];
  total_alternatives_to_list?: number;
  best_overall_alternative?: string;
  product_category?: string;
  key_features_to_consider?: string[];
  budget_tiers?: string[];
  common_mistakes_to_avoid?: string[];

  // ── Navigational type-specific ────────────────────────────────────────────
  brand_name?: string;
  core_values?: string[];
  founding_year?: number;
  key_products_or_services?: string[];
  hero_headline?: string;
  primary_call_to_action?: string;
  key_benefits?: string[];
  social_proof_elements?: string[];
  topic_or_module?: string;
  intended_audience_technical_level?: string;
  prerequisites_needed?: string[];
  includes_code_snippets?: boolean;
  number_of_features_highlighted?: number;
  target_user_role?: string;
  integration_mentions?: string[];
  platform_name?: string;
  top_categories?: string[];
  most_popular_articles?: string[];
  search_bar_prominence?: boolean;
  common_login_issues?: string[];
  support_contact_included?: boolean;
  company_name?: string;
  mission_statement?: string;
  key_milestones?: string[];
  team_members_mentioned?: string[];
  contact_methods?: string[];
  expected_response_time?: string;
  office_locations?: string[];

  // ── Transactional type-specific ───────────────────────────────────────────
  campaign_name?: string;
  lead_magnet?: string;
  conversion_goal?: string;
  benefits_highlighted?: string[];
  pricing_model?: string;
  has_free_tier?: boolean;
  product_or_service?: string;
  main_pain_point_addressed?: string;
  urgency_or_scarcity_element?: string;
  guarantee_or_risk_reversal?: string;
  primary_cta?: string;
  service_name?: string;
  service_area?: string;
  the_process?: string[];
  why_choose_us?: string[];
  value_prop_reminder?: string;
  social_login_options?: string[];
  required_fields?: string[];
  booking_tool_integration?: string;
  what_to_expect?: string[];
  qualifying_questions?: string[];
  brand_or_product?: string;
  offer_details?: string;
  expiration_date?: string;
  terms_and_conditions?: string[];
  store_name?: string;
  trust_signals?: string[];
  accepted_payment_methods?: string[];
  upsell_or_cross_sell?: string;

  // ── Frontend-only retry tracking (not in backend state) ───────────────────
  outline_retries?: number;
  draft_retries?: number;
  review_retries?: number;
  max_retries?: number;
};

export type ContentDraft = {
  title: string | undefined;
  body_markdown: string;
  word_count: number;
  sections_completed: string[];
  status: "approved" | "rejected";
  rejected_reason?: string;
};

export type ReadabilityMetrics = {
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  gunning_fog_index: number;
  smog_index: number;
  automated_readability_index: number;
  coleman_liau_index: number;
  dale_chall_score: number;
};

export type ContentReview = {
  seo_score: number;
  trust_score?: TrustScore;
  readability_metrics: ReadabilityMetrics;
  eeat_score?: number;
  eeat_data?: EEATData;
  plagiarism_score?: number;
  passed: boolean;
  missing_points: string[];
  improvement_suggestions: string[];
};

export type EEATData = {
  score: number;
  author_credibility: number;
  expertise: number;
  authority: number;
  trustworthiness: number;
  citations_references: number;
  content_accuracy: number;
  freshness: number;
  transparency: number;
  spam_signals: number;
  technical_trust: number;
  reasoning: string;
};

export type ContentImage = {
  media_id: string | null;
  alt_text: string;
  context: string;
  placement: string;
};

export type ContentLink = {
  url: string;
  anchor_text: string;
  link_type: "internal" | "outbound";
  placement: string;
  rel: string | null;
};

export type SchemaMarkup = {
  schema_type: string;
  schema_data: string;
};

export type TrustScore = {
  score: number;
  trust_score: number;
  author_credibility: number;
  expertise: number;
  authority: number;
  trustworthiness: number;
  citations_references: number;
  content_accuracy: number;
  freshness: number;
  transparency: number;
  spam_signals: number;
  technical_trust: number;
  reasoning: string;
};

export type FinalContent = {
  title: string | undefined;
  slug?: string;
  content?: string; // Kept for backward compatibility if needed, though backend uses body_markdown
  body_markdown: string;
  html_content?: string;
  final_content?: FinalContent;
  body_html?: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  primary_keyword?: string;
  focus_keyphrase?: string;
  keyphrase_density?: number;
  secondary_keywords?: string[];
  introduction?: string;
  images?: ContentImage[];
  internal_links?: ContentLink[];
  outbound_links?: ContentLink[];
  schema_markup?: SchemaMarkup;
  word_count: number;
  status: "approved" | "rejected" | "generated";
  rejected_reason?: string;
};

export type CONTENT = {
  topics: string[];
  selected_topic: string | undefined;
  content_type?: string;
  outline: ContentOutline;
  review?: ContentReview;
  final_content?: FinalContent;
  status:
    | "planning"
    | "drafting"
    | "reviewing"
    | "editing"
    | "optimizing"
    | "completed"
    | "failed";
  action?: "publish" | "edit" | "save";
  site_id?: string;
  error?: string;
};

// =========================
// SERP & SCRAPE STATE
// =========================

export type SERPEngineState = {
  search_params?: Record<string, unknown>;
  organic_results: Array<Record<string, unknown>>;
  related_searches: string[];
  people_ask: Array<Record<string, unknown>>;
  search_information: Record<string, unknown>;
  total_results: number;
};

export type Competitor = {
  domain: string;
  top_positions: number[];
  total_occurrences: number;
  has_sitelinks: boolean;
  intent_distribution: Record<string, number>;
  freshness: Record<string, number>;
  avg_snippet_length: number;
  featured_snippet: boolean;
  is_brand: boolean;
};

export type DocumentScrapeData = {
  document: unknown; // Ideally this matches langchain_core.documents.Document structure
  content_length: number;
  keywords: string[];
  headings: string[];
};

export type ScrapeContext = {
  documents: DocumentScrapeData[];
  total_documents: number;
};

export type WREXT = {
  messages: Message[];

  // SERP
  serp_payload: {
    query: string;
    country: string;
  };
  serp_result: SERPEngineState;
  serp_normalized: SERPNormalized;
  interrupts?: Interrupt[];

  // Competition
  competitors: Competitor[];

  // Content & Scraping
  scrape_context: ScrapeContext;
  relevant_context: unknown[]; // List of Documents

  // SEO Output
  seo_result: SEORESULT;

  // Content Output
  content: CONTENT;

  // UI/Flow specific fields (from interrupts or custom logic)
  status?: string;
  rejected_reason?: string;
  instruction_response?: string;
  "Selected Topic"?: string;
  "Primary Keyword"?: string;
  Recommendations?: string[];
  continue_workflow?: boolean;

  // LangGraph specialized fields
  __interrupt__?: Interrupt[];
};

export type SearchIntentState = {
  primary_intent:
    | "informational"
    | "commercial"
    | "transactional"
    | "navigational";
  secondary_intents: string[];
  confidence: number;
  intent_signals: Record<string, number>;
};

export type KDBreakdown = {
  link_score?: number;
  serp_score?: number;
  content_score?: number;
  context_modifier?: number;
  brand_dominance?: number;
  freshness_pressure?: number;
};

export type KeywordDifficultyState = {
  keyword: string;
  difficulty_score: number;
  difficulty_level: "easy" | "medium" | "hard" | "very_hard";
  breakdown: KDBreakdown;
  notes: string[];
};

export type KeywordDifficultyState2 = {
  keyword: string;
  kd: number;
  breakdown: {
    competitor_details: Array<{
      domain: string;
      link_kd: number;
      serp_kd: number;
      content_kd: number;
      total_kd: number;
    }>;
  };
  clean_text?: string;
  notes: string[];
};

export type ContentPatternState = {
  content_type:
    | "blog"
    | "listicle"
    | "landing_page"
    | "documentation"
    | "comparison";
  avg_word_count: number;
  common_headings: string[];
  heading_depth: number;
  media_usage: Record<string, number>;
  schema_types: string[];
};

export type ContentGapState = {
  missing_topics: string[];
  missing_questions: string[];
  weak_coverage_areas: string[];
  recommended_sections: string[];
};

export type AuthorityState = {
  avg_domain_strength: number;
  dominant_domains: string[];
  brand_presence: boolean;
  freshness_bias: boolean;
  authority_level: "low" | "medium" | "high";
};

export type SERPFeatureImpactState = {
  features_present: string[];
  ctr_loss_estimate: number;
  blocking_features: string[];
  opportunity_features: string[];
};

export type ExtractedKeyword = {
  keyword: string;
  score: number;
  raw_tfidf: number;
  rank: number;
  word_count: number;
  in_query: boolean;
  in_topics: boolean;
};

export type ExtractedKeywordsState = {
  all: ExtractedKeyword[];
  total_count: number;
  query: string;
  extraction_method: string;
  sources: Record<string, number>;
};

export type TitleRecommendation = {
  title: string;
  score: number;
  char_count: number;
  word_count: number;
  reasons: string[];
  rank: number;
};

export type KeywordRecommendationState = {
  original_title: string;
  recommendations: TitleRecommendation[];
  patterns_found: Record<string, unknown>;
  top_keywords_used: string[];
  total_competitors_analyzed: number;
  is_changed: boolean;
  error?: string;
};

export type SEOOpportunityState = {
  opportunity_score: number;
  opportunity_level: "low" | "medium" | "high";
  key_drivers: Record<string, unknown>;
};

export type SEOStrategyState = {
  target_intent: string;
  recommended_content_type: string;
  ideal_word_count: number;
  priority_topics: string[];
  questions_to_answer: string[];
  difficulty: string;
  ranking_time_estimate: string;
  content_angle: string;
};

export type Issue = {
  type: string;
  message: string;
  level: string;
};

export type IssueSummary = {
  critical: number;
  errors: number;
  warnings: number;
};

export type SEORESULT = {
  extracted_keywords?: ExtractedKeywordsState;
  keyword_difficulty?: KeywordDifficultyState | number;
  keyword_difficulty2?: KeywordDifficultyState2;
  keyword_recommendations?: KeywordRecommendationState;
  intent?: SearchIntentState | string;
  content_pattern?: ContentPatternState;
  content_gaps?: ContentGapState;
  authority?: AuthorityState;
  serp_features?: SERPFeatureImpactState;
  seo_strategy?: SEOStrategyState;
  seo_opportunity?: SEOOpportunityState;
  volume?: string;
  seo_health_score: number;
  issue_summary: IssueSummary;
  issues: Issue[];
};

export type StreamUpdates = Partial<WREXT> & {
  compute_keyword_difficulty?: {
    seo_result?: {
      keyword_difficulty?: {
        kd: number;
      };
    };
  };
  generate_content?: {
    content?: {
      final_content?: FinalContent;
    };
  };
  content_engine?: {
    content?: {
      final_content?: FinalContent;
    };
  };
  calculate_on_page_seo?: {
    content?: {
      review?: {
        on_page_metrics?: SEORESULT;
      };
    };
  };
  calculate_eeat_trust?: {
    content?: {
      review?: {
        trust_score?: TrustScore;
        eeat_data?: EEATData;
      };
    };
  };
  calculate_readability?: {
    content?: {
      review?: {
        readability_metrics?: ReadabilityMetrics;
      };
    };
  };
} & Record<string, unknown>;

export type AppStep =
  | "keyword"
  | "suggestions"
  | "topics"
  | "topic-type"
  | "outline"
  | "outline-reject"
  | "content";

export type Outline = ContentOutline;

export interface PageState {
  step: AppStep;
  userKeyword: string;
  country: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  generatedContent: string;
  threadId: string | null;
  rejectedReason: string;
  outline: ContentOutline | null;
  topics: string[];
  instruction: string;
  instructionType: string;
  isEditing: boolean;
  seoResult: SEORESULT | null;
  serp: SERPEngineState | null;
  competitors: Competitor[] | null;
  currentContentState: CONTENT | null;
  interrupt: Interrupt[] | null;
  contentTypes: string[];
  loadingStatus?: string;
  isLoading: boolean;
  isManualLoading: boolean;
  completedNodes: string[];
  readabilityScore: ReadabilityMetrics | null;
  seoScore: SEORESULT | null;
  trustScore: TrustScore | null;
  eeatData: EEATData | null;
  allContent: FinalContent | null;
  currentLoadingSteps: LoadingStep[];
  keywordDifficulty: number | null;
}

export type PageAction =
  | { type: "SET_STEP"; payload: AppStep }
  | { type: "SET_INSTRUCTION_TYPE"; payload: string }
  | { type: "SET_USER_KEYWORD"; payload: string }
  | { type: "SET_PRIMARY_KEYWORD"; payload: string }
  | { type: "SET_COUNTRY"; payload: string }
  | { type: "SET_THREAD_ID"; payload: string | null }
  | { type: "SET_REJECTED_REASON"; payload: string }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_GENERATED_CONTENT"; payload: string }
  | { type: "SET_ALL_CONTENT"; payload: FinalContent | null }
  | { type: "SET_READABILITY_SCORE"; payload: ReadabilityMetrics }
  | { type: "SET_TRUST_SCORE"; payload: TrustScore }
  | { type: "SET_SEO_SCORE"; payload: SEORESULT }
  | { type: "SET_INSTRUCTION_TYPE"; payload: string }
  | { type: "UPDATE_FROM_STREAM"; payload: StreamUpdates }
  | { type: "RESET_FOR_REJECT" }
  | { type: "SUBMIT_REJECT_REASON" }
  | { type: "SET_INTERRUPT"; payload: Interrupt[] }
  | { type: "SET_LOADING_STATUS"; payload: string }
  | { type: "SET_LOADING_STEPS"; payload: LoadingStep[] }
  | { type: "SET_MANUAL_LOADING"; payload: boolean }
  | { type: "ADD_COMPLETED_NODE"; payload: string }
  | { type: "ADD_COMPLETED_NODE"; payload: string }
  | { type: "CLEAR_COMPLETED_NODES" }
  | { type: "SET_KEYWORD_DIFFICULTY"; payload: number }
  | { type: "SET_OUTLINE"; payload: ContentOutline };

export type StreamInput = {
  serp_payload?: {
    query: string;
    country: string;
    user_id?: string;
    workspace_id?: string;
  };
};

export type ResumeInput = {
  command: { resume: Record<string, unknown> };
};

export type RunStreamEvent<T = unknown> = {
  event: string;
  data: T;
};

export type ResumeOptions = {
  payload: Record<string, unknown>;
  status?: string;
};

export type WorkflowStep =
  | "KEYWORD_SELECT"
  | "TOPIC_SELECT"
  | "CONTENT_TYPE_SELECT"
  | "OUTLINE_APPROVE"
  | "OUTLINE_REJECT"
  | "OUTLINE_REJECT_REASON";

export interface StoredKeyword {
  original_query: string;
  recommendations: string[];
  questions?: string[];
  related_topics?: string[];
  top_organic_results?: NormalizedOrganicResult[];
  seo_state: {
    keyword_difficulty: number | null;
    intent: string;
    volume: number | string;
    backlinks: number | null;
    referring_domains: number | null;
  };
  timestamp: string;
}

export interface LibraryItem {
  id: string;
  keyword: string;
  difficulty: string;
  difficultyScore: number | null;
  volume: string | number;
  intent: string;
  lastUpdated: string;
  rawData: StoredKeyword;
  namespace: string[];
}

export interface StoreItem {
  value: StoredKeyword;
  key: string;
  namespace: string[];
}
