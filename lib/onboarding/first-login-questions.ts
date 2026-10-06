/**
 * The questions asked once at first login (plans/app/D-pages.md §2.9), with the answers the
 * backend stores as text (user_industry, user_role, user_goal, heard_from). The values are the ones
 * the old onboarding sent, so earlier answers read the same.
 */
export const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology and software" },
  { value: "marketing", label: "Marketing and advertising" },
  { value: "ecommerce", label: "E-commerce and retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education and training" },
  { value: "finance", label: "Finance and banking" },
  { value: "media", label: "Media and publishing" },
  { value: "consulting", label: "Consulting and services" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" },
] as const;

export const ROLE_OPTIONS = [
  { value: "founder", label: "Founder or CEO" },
  { value: "marketing", label: "Marketing" },
  { value: "content", label: "Content" },
  { value: "sales", label: "Sales" },
  { value: "developer", label: "Development" },
  { value: "designer", label: "Design" },
  { value: "consultant", label: "Consulting" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const;

export const GOAL_OPTIONS = [
  { value: "scale_content", label: "Publish more content" },
  { value: "improve_quality", label: "Improve the content's quality" },
  { value: "save_time", label: "Save time writing" },
  { value: "team_collaboration", label: "Work on content as a team" },
  { value: "consistency", label: "Keep the brand consistent" },
  { value: "explore", label: "Just exploring" },
] as const;

export const HEARD_FROM_OPTIONS = [
  { value: "search", label: "A search engine" },
  { value: "social", label: "Social media" },
  { value: "friend", label: "A friend or colleague" },
  { value: "blog", label: "A blog or article" },
  { value: "youtube", label: "YouTube or a video" },
  { value: "podcast", label: "A podcast" },
  { value: "ad", label: "An advertisement" },
  { value: "review", label: "A review site" },
  { value: "other", label: "Somewhere else" },
] as const;
