/**
 * Contextual Suggestions Utility
 *
 * Provides smart defaults and contextual suggestions based on user selections.
 * Implements Task 7 requirements for filtering audience options by industry
 * and recommending tones by purpose.
 */

import type {
  Industry,
  PurposeType,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Industry-specific audience suggestions mapping
 * Based on common target audiences for each industry
 */
export const INDUSTRY_AUDIENCE_MAP: Record<Industry, string[]> = {
  technology: [
    "Software developers",
    "IT professionals",
    "Tech startups",
    "System administrators",
    "DevOps engineers",
    "Product managers",
    "Tech entrepreneurs",
    "Data scientists",
  ],
  healthcare: [
    "Medical professionals",
    "Healthcare administrators",
    "Patients and families",
    "Nurses and caregivers",
    "Healthcare executives",
    "Medical researchers",
    "Healthcare IT professionals",
    "Medical students",
  ],
  finance: [
    "Financial advisors",
    "Investment professionals",
    "Banking executives",
    "Accountants and CPAs",
    "Insurance agents",
    "Financial analysts",
    "Personal finance enthusiasts",
    "Small business owners",
  ],
  education: [
    "Teachers and educators",
    "Students and learners",
    "School administrators",
    "Education policymakers",
    "Parents and families",
    "EdTech professionals",
    "Academic researchers",
    "Training coordinators",
  ],
  travel: [
    "Travel enthusiasts",
    "Business travelers",
    "Travel agents",
    "Hospitality professionals",
    "Tourism boards",
    "Adventure seekers",
    "Budget travelers",
    "Travel bloggers",
  ],
  food: [
    "Food enthusiasts",
    "Restaurant owners",
    "Chefs and culinary professionals",
    "Food bloggers",
    "Health-conscious consumers",
    "Home cooks",
    "Food industry professionals",
    "Nutrition specialists",
  ],
  fashion: [
    "Fashion enthusiasts",
    "Retail professionals",
    "Fashion designers",
    "Style bloggers",
    "E-commerce shoppers",
    "Fashion buyers",
    "Sustainable fashion advocates",
    "Fashion students",
  ],
  business: [
    "Small business owners",
    "Entrepreneurs",
    "Business executives",
    "Consultants",
    "Sales professionals",
    "Operations managers",
    "Business analysts",
    "Startup founders",
  ],
  marketing: [
    "Marketing professionals",
    "Digital marketers",
    "Content creators",
    "Social media managers",
    "Brand managers",
    "Marketing agencies",
    "Growth hackers",
    "Marketing students",
  ],
  science: [
    "Researchers and scientists",
    "Academic professionals",
    "Science enthusiasts",
    "STEM students",
    "Science communicators",
    "Lab technicians",
    "Research institutions",
    "Science educators",
  ],
  sports: [
    "Athletes and sports professionals",
    "Sports fans",
    "Fitness enthusiasts",
    "Coaches and trainers",
    "Sports organizations",
    "Youth sports parents",
    "Sports media professionals",
    "Recreational players",
  ],
  lifestyle: [
    "Lifestyle enthusiasts",
    "Personal development seekers",
    "Wellness advocates",
    "Life coaches",
    "Self-improvement enthusiasts",
    "Productivity enthusiasts",
    "Mindfulness practitioners",
    "Work-life balance seekers",
  ],
  government: [
    "Government employees",
    "Public policy professionals",
    "Citizens and voters",
    "Non-profit organizations",
    "Community leaders",
    "Public administrators",
    "Policy researchers",
    "Civic engagement advocates",
  ],
  "real-estate": [
    "Home buyers and sellers",
    "Real estate agents",
    "Property investors",
    "Real estate developers",
    "Property managers",
    "First-time homebuyers",
    "Commercial real estate professionals",
    "Real estate investors",
  ],
  ecommerce: [
    "Online shoppers",
    "E-commerce business owners",
    "Digital retailers",
    "Online marketplace sellers",
    "E-commerce managers",
    "Dropshipping entrepreneurs",
    "E-commerce developers",
    "Online marketing professionals",
  ],
  hr: [
    "HR professionals",
    "Talent acquisition specialists",
    "Business leaders",
    "Employee development managers",
    "Workplace culture advocates",
    "Compensation analysts",
    "HR consultants",
    "People operations professionals",
  ],
  legal: [
    "Legal professionals",
    "Law firm partners",
    "Corporate legal teams",
    "Legal clients",
    "Paralegal professionals",
    "Law students",
    "Legal tech professionals",
    "Compliance officers",
  ],
  fitness: [
    "Fitness enthusiasts",
    "Personal trainers",
    "Gym owners",
    "Health and wellness coaches",
    "Nutrition specialists",
    "Athletic performance coaches",
    "Fitness app users",
    "Active lifestyle advocates",
  ],
  other: [
    "General audience",
    "Industry professionals",
    "Business owners",
    "Consumers",
    "Enthusiasts",
    "Specialists",
  ],
};

/**
 * Get contextual audience suggestions based on selected industry
 */
export function getContextualAudienceSuggestions(
  industry: Industry,
  existingSuggestions: string[] = [],
): string[] {
  const industrySuggestions =
    INDUSTRY_AUDIENCE_MAP[industry] || INDUSTRY_AUDIENCE_MAP.other;

  // Filter out already selected suggestions and return top 8 for UI space
  const filteredSuggestions = industrySuggestions
    .filter((suggestion) => !existingSuggestions.includes(suggestion))
    .slice(0, 8);

  return filteredSuggestions;
}

/**
 * Get smart default suggestions for first-time users
 */
export function getSmartDefaults() {
  return {
    wizardMode: "industry-first" as const,
    industry: "business" as Industry,
    purpose: ["educate-inform"] as PurposeType[],
    num_topics: 5,
  };
}

/**
 * Check if suggestions need to be updated based on form data changes
 */
export function shouldUpdateSuggestions(
  previousFormData: Partial<TopicBuilderFormData>,
  currentFormData: Partial<TopicBuilderFormData>,
): boolean {
  return (
    previousFormData?.industry !== currentFormData?.industry ||
    JSON.stringify(previousFormData?.purpose) !==
      JSON.stringify(currentFormData?.purpose)
  );
}
