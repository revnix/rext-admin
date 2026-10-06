export interface LoadingStep {
  id: string;
  label: string;
}

export const INITIAL_ANALYSIS_STEPS: LoadingStep[] = [
  { id: "Creating session", label: "Creating session" },
  { id: "Starting analysis", label: "Starting analysis" },
  { id: "Normalize Serp", label: "Normalizing search results" },
  { id: "Extract Competitor", label: "Extracting competitors" },
  { id: "Serp Payload", label: "SERP Payload" },
  { id: "Seo Entry", label: "Processing SEO entry data" },
  { id: "Fetch Dataforseo Backlinks", label: "Analyzing backlink metrics" },
];

export const KEYWORD_SELECTION_STEPS: LoadingStep[] = [
  { id: "Keyword Recommendation", label: "Keyword Recommendation" },
  { id: "Seo Engine", label: "SEO Engine" },
];

export const TOPIC_GENERATION_STEPS: LoadingStep[] = [
  { id: "Topic Generation", label: "Suggesting titles" },
];

export const TOPIC_REGENERATION_STEPS: LoadingStep[] = [
  { id: "Regenerating topics", label: "Regenerating titles" },
];

export const CONTENT_TYPE_STEPS: LoadingStep[] = [
  { id: "Generate Outline", label: "Generating Content Outline" },
];

export const FINAL_GENERATION_STEPS: LoadingStep[] = [
  { id: "Review Outline", label: "Reviewing Outline" },
  { id: "Generate Content", label: "Generating Content" },
  { id: "Inject Eeat", label: "Injecting EEAT" },
  { id: "Humanize Content", label: "Humanizing Content" },
  { id: "Calculate On Page Seo", label: "Calculating SEO Metrics" },
  { id: "Calculate Readability", label: "Analyzing Readability" },
  { id: "Calculate Eeat Trust", label: "Verifying Trust Signals" },
  { id: "Review Content", label: "Final Content Review" },
];
