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
 * Industry-specific topic suggestions mapping
 * Provides examples of popular topics within each industry
 */
export const INDUSTRY_TOPIC_MAP: Record<Industry, string[]> = {
  technology: [
    "AI implementation strategies for small businesses",
    "Cybersecurity best practices for remote teams",
    "Cloud migration planning and execution",
    "DevOps automation tools comparison",
    "Machine learning applications in business",
    "Software architecture patterns for scalability",
    "API security and authentication methods",
    "Database optimization techniques",
  ],
  healthcare: [
    "Telemedicine adoption best practices",
    "Patient data privacy compliance",
    "Healthcare technology integration",
    "Mental health resources for healthcare workers",
    "Electronic health records optimization",
    "Medical device maintenance protocols",
    "Healthcare workflow automation",
    "Patient engagement strategies",
  ],
  finance: [
    "Investment portfolio diversification strategies",
    "Financial planning for retirement",
    "Cryptocurrency risk assessment",
    "Small business loan application process",
    "Tax optimization strategies for professionals",
    "Insurance coverage comparison guide",
    "Budgeting techniques for families",
    "Real estate investment fundamentals",
  ],
  education: [
    "Online learning platform effectiveness",
    "Student engagement strategies for remote learning",
    "Educational technology implementation",
    "Assessment and grading best practices",
    "Curriculum development methodologies",
    "Parent-teacher communication strategies",
    "Learning disability support resources",
    "STEM education program design",
  ],
  travel: [
    "Budget travel tips for international destinations",
    "Solo travel safety guidelines",
    "Sustainable tourism practices",
    "Business travel expense management",
    "Travel photography techniques",
    "Cultural etiquette for international travelers",
    "Travel insurance comparison guide",
    "Digital nomad destination reviews",
  ],
  food: [
    "Plant-based meal planning guides",
    "Restaurant kitchen efficiency optimization",
    "Food safety protocols for small restaurants",
    "Seasonal cooking with local ingredients",
    "Food photography for social media",
    "Dietary restriction menu planning",
    "Food waste reduction strategies",
    "Culinary skills development for beginners",
  ],
  fashion: [
    "Sustainable fashion brand strategies",
    "Seasonal wardrobe planning guides",
    "Fashion photography and styling tips",
    "Size inclusivity in fashion design",
    "E-commerce fashion marketing strategies",
    "Fabric selection and care guides",
    "Fashion trend forecasting methods",
    "Personal style development tips",
  ],
  business: [
    "Digital marketing strategies for small restaurants",
    "Employee retention best practices",
    "Customer service excellence frameworks",
    "Business process automation tools",
    "Leadership development programs",
    "Market research methodologies",
    "Sales funnel optimization techniques",
    "Partnership and collaboration strategies",
  ],
  marketing: [
    "Content marketing ROI measurement",
    "Social media algorithm optimization",
    "Email marketing automation strategies",
    "Brand storytelling techniques",
    "Influencer partnership guidelines",
    "SEO content optimization methods",
    "Customer persona development process",
    "Video marketing production tips",
  ],
  science: [
    "Research methodology best practices",
    "Scientific data visualization techniques",
    "Lab safety protocol implementation",
    "Peer review process guidelines",
    "Science communication for public audiences",
    "Grant writing strategies for researchers",
    "Collaborative research project management",
    "Open science publishing practices",
  ],
  sports: [
    "Athletic performance optimization techniques",
    "Sports injury prevention strategies",
    "Youth sports coaching methodologies",
    "Sports nutrition planning guides",
    "Team building exercises for athletes",
    "Sports psychology applications",
    "Training program periodization",
    "Sports equipment maintenance guides",
  ],
  lifestyle: [
    "Work-life balance strategies for professionals",
    "Mindfulness meditation techniques",
    "Productivity system implementation",
    "Personal goal setting frameworks",
    "Stress management for busy parents",
    "Home organization and decluttering",
    "Healthy habit formation strategies",
    "Time management for entrepreneurs",
  ],
  government: [
    "Public policy development processes",
    "Citizen engagement strategies",
    "Government transparency initiatives",
    "Public service delivery optimization",
    "Community outreach program design",
    "Policy implementation best practices",
    "Public sector digital transformation",
    "Electoral process improvement methods",
  ],
  "real-estate": [
    "First-time homebuyer guidance",
    "Property investment analysis methods",
    "Real estate market trend analysis",
    "Home staging for faster sales",
    "Property valuation techniques",
    "Real estate negotiation strategies",
    "Commercial property investment guides",
    "Real estate marketing in digital age",
  ],
  ecommerce: [
    "E-commerce conversion optimization",
    "Online store customer experience design",
    "Inventory management for online retailers",
    "E-commerce shipping strategy optimization",
    "Product photography for online sales",
    "Customer service automation in e-commerce",
    "Social commerce integration strategies",
    "E-commerce analytics and reporting",
  ],
  hr: [
    "Remote employee onboarding processes",
    "Performance management system design",
    "Workplace diversity and inclusion strategies",
    "Employee benefits program optimization",
    "Talent acquisition in competitive markets",
    "Workplace culture development",
    "HR technology implementation",
    "Employee engagement measurement",
  ],
  legal: [
    "Contract negotiation best practices",
    "Legal technology adoption strategies",
    "Client communication in legal services",
    "Legal research methodology",
    "Compliance program development",
    "Law firm business development",
    "Legal document automation",
    "Client relationship management for lawyers",
  ],
  fitness: [
    "Personal training program design",
    "Gym member retention strategies",
    "Nutrition coaching methodologies",
    "Fitness class instruction techniques",
    "Exercise modification for injuries",
    "Fitness goal setting and tracking",
    "Group fitness program development",
    "Fitness equipment maintenance",
  ],
  other: [
    "Industry best practices analysis",
    "Professional development strategies",
    "Customer service excellence",
    "Business communication techniques",
    "Problem-solving methodologies",
    "Leadership development approaches",
    "Quality improvement processes",
    "Innovation management strategies",
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
 * Get contextual topic suggestions based on selected industry
 */
export function getContextualTopicSuggestions(
  industry: Industry,
  limit: number = 3,
): string[] {
  const industryTopics =
    INDUSTRY_TOPIC_MAP[industry] || INDUSTRY_TOPIC_MAP.other;

  // Return limited number of suggestions for UI space
  return industryTopics.slice(0, limit);
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
