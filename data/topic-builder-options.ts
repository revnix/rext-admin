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

  // Travel & Hospitality industry audiences
  if (
    industryLower.includes("travel") ||
    industryLower.includes("hospitality") ||
    industryLower.includes("tourism")
  ) {
    return [
      { label: "Leisure Travelers", value: "leisure-travelers" },
      { label: "Business Travelers", value: "business-travelers" },
      { label: "Travel Agents", value: "travel-agents" },
      { label: "Hotel Managers", value: "hotel-managers" },
      { label: "Tour Operators", value: "tour-operators" },
      { label: "Travel Bloggers", value: "travel-bloggers" },
      { label: "Event Planners", value: "event-planners" },
      { label: "Backpackers", value: "backpackers" },
    ];
  }

  // Food & Culinary industry audiences
  if (
    industryLower.includes("food") ||
    industryLower.includes("culinary") ||
    industryLower.includes("restaurant")
  ) {
    return [
      { label: "Home Cooks", value: "home-cooks" },
      { label: "Professional Chefs", value: "chefs" },
      { label: "Restaurant Owners", value: "restaurant-owners" },
      { label: "Food Bloggers", value: "food-bloggers" },
      { label: "Nutritionists", value: "nutritionists" },
      { label: "Food Critics", value: "food-critics" },
      { label: "Culinary Students", value: "culinary-students" },
      { label: "Food Enthusiasts", value: "food-enthusiasts" },
    ];
  }

  // Fashion & Beauty industry audiences
  if (
    industryLower.includes("fashion") ||
    industryLower.includes("beauty") ||
    industryLower.includes("cosmetics")
  ) {
    return [
      { label: "Fashion Enthusiasts", value: "fashion-enthusiasts" },
      { label: "Fashion Designers", value: "fashion-designers" },
      { label: "Beauty Consumers", value: "beauty-consumers" },
      { label: "Makeup Artists", value: "makeup-artists" },
      { label: "Style Influencers", value: "style-influencers" },
      { label: "Retail Buyers", value: "retail-buyers" },
      { label: "Personal Stylists", value: "personal-stylists" },
      { label: "Fashion Students", value: "fashion-students" },
    ];
  }

  // Sports & Fitness industry audiences
  if (
    industryLower.includes("sports") ||
    industryLower.includes("fitness") ||
    industryLower.includes("exercise")
  ) {
    return [
      { label: "Athletes", value: "athletes" },
      { label: "Fitness Enthusiasts", value: "fitness-enthusiasts" },
      { label: "Personal Trainers", value: "personal-trainers" },
      { label: "Gym Owners", value: "gym-owners" },
      { label: "Coaches", value: "coaches" },
      { label: "Sports Fans", value: "sports-fans" },
      { label: "Beginners", value: "fitness-beginners" },
      { label: "Competitive Athletes", value: "competitive-athletes" },
    ];
  }

  // Real Estate industry audiences
  if (
    industryLower.includes("real estate") ||
    industryLower.includes("property") ||
    industryLower.includes("realty")
  ) {
    return [
      { label: "Home Buyers", value: "home-buyers" },
      { label: "Home Sellers", value: "home-sellers" },
      { label: "Real Estate Agents", value: "real-estate-agents" },
      { label: "Property Investors", value: "property-investors" },
      { label: "Property Managers", value: "property-managers" },
      { label: "First-Time Buyers", value: "first-time-buyers" },
      { label: "Real Estate Brokers", value: "real-estate-brokers" },
      { label: "Commercial Investors", value: "commercial-investors" },
    ];
  }

  // Retail & E-commerce industry audiences
  if (
    industryLower.includes("retail") ||
    industryLower.includes("ecommerce") ||
    industryLower.includes("e-commerce")
  ) {
    return [
      { label: "Online Shoppers", value: "online-shoppers" },
      { label: "Store Owners", value: "store-owners" },
      { label: "Retail Managers", value: "retail-managers" },
      { label: "E-commerce Entrepreneurs", value: "ecommerce-entrepreneurs" },
      { label: "Customer Service", value: "customer-service" },
      { label: "Digital Marketers", value: "digital-marketers" },
      { label: "Product Managers", value: "product-managers" },
      { label: "Supply Chain Managers", value: "supply-chain-managers" },
    ];
  }

  // Manufacturing industry audiences
  if (
    industryLower.includes("manufacturing") ||
    industryLower.includes("production") ||
    industryLower.includes("industrial")
  ) {
    return [
      { label: "Manufacturing Engineers", value: "manufacturing-engineers" },
      { label: "Plant Managers", value: "plant-managers" },
      { label: "Quality Control", value: "quality-control" },
      { label: "Supply Chain Professionals", value: "supply-chain" },
      { label: "Operations Managers", value: "operations-managers" },
      { label: "Safety Officers", value: "safety-officers" },
      { label: "Maintenance Technicians", value: "maintenance-techs" },
      { label: "Production Workers", value: "production-workers" },
    ];
  }

  // Automotive industry audiences
  if (
    industryLower.includes("automotive") ||
    industryLower.includes("auto") ||
    industryLower.includes("vehicle")
  ) {
    return [
      { label: "Car Buyers", value: "car-buyers" },
      { label: "Car Dealers", value: "car-dealers" },
      { label: "Mechanics", value: "mechanics" },
      { label: "Automotive Engineers", value: "automotive-engineers" },
      { label: "Car Enthusiasts", value: "car-enthusiasts" },
      { label: "Fleet Managers", value: "fleet-managers" },
      { label: "Auto Insurance Agents", value: "auto-insurance-agents" },
      { label: "Parts Suppliers", value: "parts-suppliers" },
    ];
  }

  // Entertainment & Media industry audiences
  if (
    industryLower.includes("entertainment") ||
    industryLower.includes("media") ||
    industryLower.includes("gaming")
  ) {
    return [
      { label: "Content Consumers", value: "content-consumers" },
      { label: "Content Creators", value: "content-creators" },
      { label: "Gamers", value: "gamers" },
      { label: "Streamers", value: "streamers" },
      { label: "Media Professionals", value: "media-professionals" },
      { label: "Artists", value: "artists" },
      { label: "Entertainment Executives", value: "entertainment-executives" },
      { label: "Fans", value: "fans" },
    ];
  }

  // Agriculture industry audiences
  if (
    industryLower.includes("agriculture") ||
    industryLower.includes("farming") ||
    industryLower.includes("agricultural")
  ) {
    return [
      { label: "Farmers", value: "farmers" },
      { label: "Agricultural Scientists", value: "agricultural-scientists" },
      { label: "Farm Equipment Dealers", value: "farm-equipment-dealers" },
      { label: "Agricultural Investors", value: "agricultural-investors" },
      { label: "Crop Consultants", value: "crop-consultants" },
      { label: "Livestock Producers", value: "livestock-producers" },
      { label: "Agricultural Students", value: "agricultural-students" },
      { label: "Farm Managers", value: "farm-managers" },
    ];
  }

  // Transportation & Logistics industry audiences
  if (
    industryLower.includes("transportation") ||
    industryLower.includes("logistics") ||
    industryLower.includes("shipping")
  ) {
    return [
      { label: "Logistics Managers", value: "logistics-managers" },
      { label: "Truck Drivers", value: "truck-drivers" },
      { label: "Freight Brokers", value: "freight-brokers" },
      { label: "Supply Chain Analysts", value: "supply-chain-analysts" },
      { label: "Warehouse Managers", value: "warehouse-managers" },
      { label: "Delivery Drivers", value: "delivery-drivers" },
      { label: "Fleet Operators", value: "fleet-operators" },
      { label: "Shipping Companies", value: "shipping-companies" },
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

// ============================================================================
// DEMOGRAPHIC OPTIONS
// ============================================================================

/**
 * Age group options for demographic targeting
 *
 * Covers major generational segments with marketing-relevant age ranges
 */
export const DEMOGRAPHIC_AGE_OPTIONS: SelectOption[] = [
  { label: "13-17 (Gen Z - Young)", value: "13-17" },
  { label: "18-24 (Gen Z - Adult)", value: "18-24" },
  { label: "25-34 (Millennials - Young)", value: "25-34" },
  { label: "35-44 (Millennials - Older)", value: "35-44" },
  { label: "45-54 (Gen X)", value: "45-54" },
  { label: "55-64 (Baby Boomers - Young)", value: "55-64" },
  { label: "65+ (Baby Boomers - Senior)", value: "65+" },
];

/**
 * Geographic location options for demographic targeting
 *
 * Includes major markets, regions, and countries for content localization
 */
export const DEMOGRAPHIC_LOCATION_OPTIONS: SelectOption[] = [
  // North America
  { label: "United States", value: "united-states" },
  { label: "Canada", value: "canada" },
  { label: "Mexico", value: "mexico" },

  // Europe
  { label: "United Kingdom", value: "united-kingdom" },
  { label: "Germany", value: "germany" },
  { label: "France", value: "france" },
  { label: "Spain", value: "spain" },
  { label: "Italy", value: "italy" },
  { label: "Netherlands", value: "netherlands" },
  { label: "Switzerland", value: "switzerland" },
  { label: "Sweden", value: "sweden" },
  { label: "Norway", value: "norway" },
  { label: "Denmark", value: "denmark" },

  // Asia Pacific
  { label: "Pakistan", value: "pakistan" },
  { label: "India", value: "india" },
  { label: "China", value: "china" },
  { label: "Japan", value: "japan" },
  { label: "South Korea", value: "south-korea" },
  { label: "Singapore", value: "singapore" },
  { label: "Hong Kong", value: "hong-kong" },
  { label: "Australia", value: "australia" },
  { label: "New Zealand", value: "new-zealand" },
  { label: "Thailand", value: "thailand" },
  { label: "Malaysia", value: "malaysia" },
  { label: "Indonesia", value: "indonesia" },
  { label: "Philippines", value: "philippines" },
  { label: "Vietnam", value: "vietnam" },

  // Middle East & Africa
  { label: "United Arab Emirates", value: "uae" },
  { label: "Saudi Arabia", value: "saudi-arabia" },
  { label: "Israel", value: "israel" },
  { label: "Turkey", value: "turkey" },
  { label: "South Africa", value: "south-africa" },
  { label: "Nigeria", value: "nigeria" },
  { label: "Egypt", value: "egypt" },

  // Latin America
  { label: "Brazil", value: "brazil" },
  { label: "Argentina", value: "argentina" },
  { label: "Chile", value: "chile" },
  { label: "Colombia", value: "colombia" },

  // Regional Groupings
  { label: "Europe (General)", value: "europe" },
  { label: "Asia Pacific (General)", value: "asia-pacific" },
  { label: "Middle East", value: "middle-east" },
  { label: "Latin America", value: "latin-america" },
  { label: "Global / International", value: "global" },
  { label: "Other", value: "other" },
];

// ============================================================================
// INDUSTRY CATEGORIZATION
// ============================================================================

/**
 * Organized industry categories for better UX and navigation
 *
 * Groups related industries together for improved wizard flow
 */
export const INDUSTRY_CATEGORIES: Record<string, SelectOption[]> = {
  "Technology & Digital": [
    { label: "Technology / IT", value: "technology" },
    { label: "E-commerce / Retail", value: "ecommerce" },
    { label: "Marketing / Advertising", value: "marketing" },
  ],

  "Health & Wellness": [
    { label: "Healthcare / Medical", value: "healthcare" },
    { label: "Fitness / Health", value: "fitness" },
    { label: "Sports / Recreation", value: "sports" },
  ],

  "Business & Finance": [
    { label: "Finance / Banking", value: "finance" },
    { label: "Business / Entrepreneurship", value: "business" },
    { label: "HR / Human Resources", value: "hr" },
    { label: "Legal / Law", value: "legal" },
    { label: "Real Estate", value: "real-estate" },
  ],

  "Education & Lifestyle": [
    { label: "Education / E-Learning", value: "education" },
    { label: "Lifestyle / Personal Development", value: "lifestyle" },
    { label: "Science / Research", value: "science" },
  ],

  "Consumer & Entertainment": [
    { label: "Travel / Hospitality", value: "travel" },
    { label: "Food / Culinary", value: "food" },
    { label: "Fashion / Beauty", value: "fashion" },
  ],

  "Government & Public": [
    { label: "Government / Public Policy", value: "government" },
  ],

  Other: [{ label: "Other", value: "other" }],
};

// ============================================================================
// UTILITY FUNCTIONS FOR DATA STRUCTURES
// ============================================================================

/**
 * Get all industry options as a flat array (for combobox/select usage)
 */
export const getAllIndustryOptions = (): SelectOption[] => {
  return Object.values(INDUSTRY_CATEGORIES).flat();
};

/**
 * Get industry category for a specific industry value
 */
export const getIndustryCategoryName = (
  industryValue: string,
): string | null => {
  for (const [categoryName, industries] of Object.entries(
    INDUSTRY_CATEGORIES,
  )) {
    if (industries.some((industry) => industry.value === industryValue)) {
      return categoryName;
    }
  }
  return null;
};

/**
 * Get all platform options that are relevant for a specific content type
 */
export const getPlatformOptionsForContentType = (
  contentType: string,
): SelectOption[] => {
  // Social media content types should show social platforms
  if (contentType === "social-media") {
    return [
      { label: "Facebook", value: "facebook" },
      { label: "Instagram", value: "instagram" },
      { label: "Twitter (X)", value: "twitter" },
      { label: "LinkedIn", value: "linkedin" },
      { label: "TikTok", value: "tiktok" },
      { label: "Other", value: "other" },
    ];
  }

  // Video content should show video platforms
  if (contentType === "video-content") {
    return [
      { label: "YouTube", value: "youtube" },
      { label: "TikTok", value: "tiktok" },
      { label: "Instagram", value: "instagram" },
      { label: "Vimeo", value: "vimeo" },
      { label: "Other", value: "other" },
    ];
  }

  // For other content types, return empty array (no platform needed)
  return [];
};

/**
 * Check if a content type requires platform selection
 */
export const doesContentTypeRequirePlatform = (
  contentType: string,
): boolean => {
  return ["social-media", "video-content"].includes(contentType);
};

/**
 * Get demographic age groups that are most relevant for an industry
 */
export const getRelevantAgeGroupsForIndustry = (
  industry: string,
): SelectOption[] => {
  const industryLower = industry.toLowerCase();

  // Education - focus on younger demographics and parents
  if (industryLower.includes("education")) {
    return [
      { label: "13-17 (Gen Z - Young)", value: "13-17" },
      { label: "18-24 (Gen Z - Adult)", value: "18-24" },
      { label: "25-34 (Millennials - Young)", value: "25-34" },
      { label: "35-44 (Millennials - Older)", value: "35-44" },
    ];
  }

  // Technology - focus on working age demographics
  if (industryLower.includes("technology")) {
    return [
      { label: "18-24 (Gen Z - Adult)", value: "18-24" },
      { label: "25-34 (Millennials - Young)", value: "25-34" },
      { label: "35-44 (Millennials - Older)", value: "35-44" },
      { label: "45-54 (Gen X)", value: "45-54" },
    ];
  }

  // Finance - focus on earning age demographics
  if (industryLower.includes("finance")) {
    return [
      { label: "25-34 (Millennials - Young)", value: "25-34" },
      { label: "35-44 (Millennials - Older)", value: "35-44" },
      { label: "45-54 (Gen X)", value: "45-54" },
      { label: "55-64 (Baby Boomers - Young)", value: "55-64" },
    ];
  }

  // Healthcare - all ages relevant
  if (
    industryLower.includes("healthcare") ||
    industryLower.includes("health")
  ) {
    return DEMOGRAPHIC_AGE_OPTIONS;
  }

  // Default: return all options
  return DEMOGRAPHIC_AGE_OPTIONS;
};
