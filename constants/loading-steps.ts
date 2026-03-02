export interface LoadingStep {
  id: string;
  label: string;
}

export const INITIAL_ANALYSIS_STEPS: LoadingStep[] = [
  { id: "serp_engine", label: "Researching SERP" },
  { id: "seo_entry", label: "Loading SEO Context" },
  { id: "fetch_dataforseo_backlinks", label: "Analyzing Backlinks" },
  { id: "keyword_recommendation", label: "Generating Suggestions" },
];

export const KEYWORD_SELECTION_STEPS: LoadingStep[] = [
  { id: "keyword_recommendation", label: "Keyword Selection" },
  { id: "topic_generation", label: "Generating Topics" },
];

export const TOPIC_GENERATION_STEPS: LoadingStep[] = [
  { id: "topic_generation", label: "Finding Topics" },
  { id: "content_type", label: "Choosing Content Type" },
];

export const CONTENT_TYPE_STEPS: LoadingStep[] = [
  { id: "content_type", label: "Selecting Format" },
  { id: "generate_outline", label: "Creating Outline" },
  { id: "review_outline", label: "Checking Outline" },
];

export const FINAL_GENERATION_STEPS: LoadingStep[] = [
  { id: "review_outline", label: "Final Outline Check" },
  { id: "generate_content", label: "Writing Draft" },
  { id: "inject_eeat", label: "Adding Authority" },
  { id: "humanize_content", label: "Polishing Voice" },
  { id: "review_content", label: "Final Review" },
];
