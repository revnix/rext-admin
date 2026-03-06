export interface LoadingStep {
  id: string;
  label: string;
}

export const INITIAL_ANALYSIS_STEPS: LoadingStep[] = [
  { id: "Creating session", label: "Creating session" },
  { id: "Starting analysis", label: "Starting analysis" },
  { id: "Fetch Serp", label: "Fetching search results" },
  { id: "Normalize Serp", label: "Normalizing search results" },
  { id: "Extract Competitor", label: "Extracting competitors" },
  { id: "Scrape Content", label: "Scraping page content" },
  { id: "scrape_flow", label: "Processing scraping workflow" },
  { id: "serp_engine", label: "Processing SERP engine data" },
  { id: "seo_entry", label: "Processing SEO entry data" },
  { id: "fetch_dataforseo_backlinksy", label: "Analyzing backlink metrics" },
];

export const KEYWORD_SELECTION_STEPS: LoadingStep[] = [
  { id: "Keyword Recommendation", label: "Keyword Recommendation" },
  { id: "Seo Engine", label: "Seo Engine" },
];

export const TOPIC_GENERATION_STEPS: LoadingStep[] = [
  { id: "Topic Generation", label: "Content Type Generation" },
];

export const CONTENT_TYPE_STEPS: LoadingStep[] = [
  { id: "Topic Type", label: "Determining Content Type" },
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
