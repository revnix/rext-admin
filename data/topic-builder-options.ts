/**
 * Topic Builder Options and Data Configuration
 *
 * This module contains all the dropdown options, industry classifications,
 * and data arrays used throughout the Topic Builder wizard.
 */

import type { SelectOption } from "@/types/shared";

// ============================================================================
// YMYL (Your Money or Your Life) INDUSTRY CLASSIFICATION
// ============================================================================

/**
 * Comprehensive list of YMYL (Your Money or Your Life) industries
 *
 * YMYL content affects a person's future happiness, health, financial stability, or safety.
 * Content in these industries requires extra care for accuracy and neutral positioning.
 *
 * Sources: Google Quality Rater Guidelines, FTC regulations, medical/financial compliance
 */
export const YMYL_INDUSTRIES = [
  // Healthcare & Medical
  "healthcare",
  "medical",
  "health",
  "mental health",
  "therapy",
  "counseling",
  "pharmacy",
  "pharmaceutical",
  "medicine",
  "medical device",
  "medical equipment",
  "dental",
  "veterinary",
  "nutrition",
  "diet",
  "supplements",
  "fitness training",
  "weight loss",
  "addiction treatment",
  "medical research",
  "clinical",
  "hospital",
  "nursing",
  "physical therapy",
  "occupational therapy",
  "chiropractic",
  "alternative medicine",
  "homeopathy",
  "acupuncture",

  // Finance & Banking
  "finance",
  "financial",
  "banking",
  "investment",
  "investing",
  "trading",
  "stock market",
  "forex",
  "cryptocurrency",
  "crypto",
  "bitcoin",
  "retirement planning",
  "pension",
  "401k",
  "ira",
  "mutual funds",
  "etf",
  "loans",
  "mortgage",
  "credit",
  "debt",
  "bankruptcy",
  "tax",
  "taxation",
  "accounting",
  "financial planning",
  "wealth management",
  "insurance",
  "life insurance",
  "health insurance",
  "auto insurance",
  "home insurance",
  "disability insurance",
  "annuities",
  "bonds",
  "securities",
  "real estate investment",
  "financial advisory",
  "credit repair",
  "payday loans",
  "personal loans",
  "student loans",
  "business loans",

  // Legal & Law
  "legal",
  "law",
  "attorney",
  "lawyer",
  "litigation",
  "court",
  "lawsuit",
  "divorce",
  "family law",
  "custody",
  "child support",
  "alimony",
  "immigration",
  "visa",
  "citizenship",
  "criminal law",
  "personal injury",
  "medical malpractice",
  "workers compensation",
  "employment law",
  "civil rights",
  "estate planning",
  "wills",
  "probate",
  "trust",
  "bankruptcy law",
  "business law",
  "contract law",
  "intellectual property",
  "patent",
  "trademark",
  "copyright",
  "tax law",
  "regulatory compliance",

  // Safety & Emergency Services
  "safety",
  "emergency",
  "security",
  "emergency services",
  "fire safety",
  "home security",
  "personal safety",
  "child safety",
  "workplace safety",
  "automotive safety",
  "product safety",
  "cybersecurity",
  "data security",
  "privacy protection",
  "identity theft",
  "fraud prevention",

  // Government & Civic
  "government benefits",
  "social security",
  "medicare",
  "medicaid",
  "disability benefits",
  "unemployment",
  "welfare",
  "public assistance",
  "voting",
  "elections",
  "civic duties",
  "public policy",

  // Major Life Events & Decisions
  "adoption",
  "foster care",
  "eldercare",
  "nursing home",
  "hospice",
  "funeral",
  "burial",
  "cremation",
  "organ donation",
  "end of life",

  // High-Stakes Education
  "medical school",
  "law school",
  "professional licensing",
  "certification exams",
  "professional development",
  "career counseling",
] as const;

/**
 * Helper function to check if an industry is considered YMYL
 * Supports case-insensitive and partial matching
 */
export const isYMYLIndustry = (industry: string): boolean => {
  if (!industry || typeof industry !== "string") {
    return false;
  }

  const industryLower = industry.toLowerCase().trim();

  return YMYL_INDUSTRIES.some(
    (ymylIndustry) =>
      industryLower.includes(ymylIndustry.toLowerCase()) ||
      ymylIndustry.toLowerCase().includes(industryLower),
  );
};

// ============================================================================
// AUDIENCE OPTIONS BY INDUSTRY
// ============================================================================

/**
 * Dynamic audience suggestions based on selected industry
 * Used to provide relevant persona options in the wizard
 */
export const getAudienceOptionsForIndustry = (
  industry: string,
): SelectOption[] => {
  const industryLower = industry.toLowerCase();

  // Education industry audiences
  if (industryLower.includes("education")) {
    return [
      { label: "Students", value: "students" },
      { label: "Teachers", value: "teachers" },
      { label: "Parents", value: "parents" },
      { label: "School Administrators", value: "administrators" },
      { label: "Educational Consultants", value: "consultants" },
      { label: "Counselors", value: "counselors" },
      { label: "Librarians", value: "librarians" },
    ];
  }

  // Healthcare industry audiences
  if (
    industryLower.includes("healthcare") ||
    industryLower.includes("medical") ||
    industryLower.includes("health")
  ) {
    return [
      { label: "Patients", value: "patients" },
      { label: "Caregivers", value: "caregivers" },
      { label: "Doctors", value: "doctors" },
      { label: "Nurses", value: "nurses" },
      { label: "Hospital Administrators", value: "hospital-admins" },
      { label: "Medical Students", value: "medical-students" },
      { label: "Healthcare IT Professionals", value: "healthcare-it" },
      { label: "Insurance Providers", value: "insurance-providers" },
    ];
  }

  // Finance industry audiences
  if (industryLower.includes("finance") || industryLower.includes("banking")) {
    return [
      { label: "Retail Investors", value: "retail-investors" },
      { label: "Financial Advisors", value: "financial-advisors" },
      { label: "Accountants", value: "accountants" },
      { label: "CFOs", value: "cfos" },
      { label: "Small Business Owners", value: "smb-owners" },
      { label: "Students", value: "students" },
      { label: "Retirees", value: "retirees" },
      { label: "Young Professionals", value: "young-professionals" },
    ];
  }

  // Technology industry audiences
  if (industryLower.includes("technology") || industryLower.includes("tech")) {
    return [
      { label: "Software Developers", value: "developers" },
      { label: "CTOs", value: "ctos" },
      { label: "IT Managers", value: "it-managers" },
      { label: "Product Managers", value: "product-managers" },
      { label: "Tech Entrepreneurs", value: "tech-entrepreneurs" },
      { label: "End Users", value: "end-users" },
      { label: "Tech Students", value: "tech-students" },
    ];
  }

  // HR industry audiences
  if (
    industryLower.includes("hr") ||
    industryLower.includes("human resources")
  ) {
    return [
      { label: "Job Seekers", value: "job-seekers" },
      { label: "Recruiters", value: "recruiters" },
      { label: "HR Managers", value: "hr-managers" },
      { label: "People Operations", value: "people-ops" },
      { label: "Team Leaders", value: "team-leaders" },
      { label: "Executives", value: "executives" },
    ];
  }

  // Marketing industry audiences
  if (
    industryLower.includes("marketing") ||
    industryLower.includes("advertising")
  ) {
    return [
      { label: "Marketing Managers", value: "marketing-managers" },
      { label: "Content Creators", value: "content-creators" },
      { label: "Social Media Managers", value: "social-media-managers" },
      { label: "Brand Managers", value: "brand-managers" },
      { label: "Digital Marketers", value: "digital-marketers" },
      { label: "Small Business Owners", value: "smb-owners" },
    ];
  }

  // Business/Entrepreneurship audiences
  if (
    industryLower.includes("business") ||
    industryLower.includes("entrepreneur")
  ) {
    return [
      { label: "Entrepreneurs", value: "entrepreneurs" },
      { label: "Small Business Owners", value: "smb-owners" },
      { label: "Startup Founders", value: "startup-founders" },
      { label: "Business Students", value: "business-students" },
      { label: "Executives", value: "executives" },
      { label: "Consultants", value: "consultants" },
    ];
  }

  // Legal industry audiences
  if (industryLower.includes("legal") || industryLower.includes("law")) {
    return [
      { label: "Legal Clients", value: "legal-clients" },
      { label: "Lawyers", value: "lawyers" },
      { label: "Paralegals", value: "paralegals" },
      { label: "Law Students", value: "law-students" },
      { label: "Small Business Owners", value: "smb-owners" },
      { label: "Individuals", value: "individuals" },
    ];
  }

  // Default general audiences for other industries
  return [
    { label: "General Public", value: "general-public" },
    { label: "Professionals", value: "professionals" },
    { label: "Students", value: "students" },
    { label: "Enthusiasts", value: "enthusiasts" },
    { label: "Beginners", value: "beginners" },
    { label: "Experts", value: "experts" },
    { label: "Business Owners", value: "business-owners" },
    { label: "Consumers", value: "consumers" },
  ];
};

/**
 * Default audience options when no industry is selected
 */
export const DEFAULT_AUDIENCE_OPTIONS: SelectOption[] = [
  { label: "General Public", value: "general-public" },
  { label: "Professionals", value: "professionals" },
  { label: "Students", value: "students" },
  { label: "Business Owners", value: "business-owners" },
  { label: "Consumers", value: "consumers" },
  { label: "Experts", value: "experts" },
  { label: "Beginners", value: "beginners" },
];
