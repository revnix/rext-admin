/**
 * Idea Builder Type Definitions
 *
 * This module defines all TypeScript interfaces and types needed for the Idea Builder
 * wizard component that helps users structure and develop their ideas.
 */

// ============================================================================
// ENUM TYPE DEFINITIONS
// ============================================================================

/**
 * Priority levels for ideas
 */
export type IdeaPriority = "low" | "medium" | "high" | "urgent";

/**
 * Idea categories
 */
export type IdeaCategory =
  | "technology"
  | "business"
  | "marketing"
  | "product"
  | "service"
  | "process"
  | "innovation";

/**
 * Target audience types
 */
export type IdeaAudience =
  | "consumers"
  | "businesses"
  | "enterprise"
  | "students"
  | "professionals"
  | "seniors"
  | "teens"
  | "parents";

/**
 * Demographic age groups
 */
export type DemographicAge =
  | "gen-z"
  | "millennial"
  | "gen-x"
  | "boomer"
  | "all-ages";

/**
 * Geographic scope
 */
export type GeographicScope = "local" | "regional" | "national" | "global";

/**
 * Solution approach types
 */
export type SolutionApproach =
  | "software"
  | "service"
  | "product"
  | "process"
  | "platform"
  | "automation";

/**
 * Resource requirements
 */
export type ResourceRequirement =
  | "self"
  | "small-team"
  | "team"
  | "large-team"
  | "external";

/**
 * Skill categories
 */
export type SkillCategory =
  | "technical"
  | "design"
  | "marketing"
  | "business"
  | "operations";

/**
 * Primary goals
 */
export type PrimaryGoal =
  | "revenue"
  | "users"
  | "efficiency"
  | "brand"
  | "problem-solving"
  | "learning"
  | "impact";

/**
 * Success metrics
 */
export type SuccessMetric =
  | "revenue"
  | "users"
  | "engagement"
  | "satisfaction"
  | "efficiency"
  | "market-share"
  | "roi";

/**
 * Audience size categories
 */
export type AudienceSize = "small" | "medium" | "large" | "massive";

/**
 * Competition levels
 */
export type CompetitionLevel = "none" | "few" | "some" | "many" | "saturated";

/**
 * Implementation timeframes
 */
export type Timeframe =
  | "1-week"
  | "2-4-weeks"
  | "1-3-months"
  | "3-6-months"
  | "6-12-months"
  | "1-year-plus";

/**
 * Budget ranges
 */
export type BudgetRange = "minimal" | "low" | "medium" | "high" | "enterprise";

/**
 * Risk assessment levels
 */
export type RiskLevel = "low" | "medium" | "high" | "experimental";

// ============================================================================
// MAIN FORM DATA INTERFACE
// ============================================================================

/**
 * Complete form data interface for the Idea Builder wizard
 */
export interface IdeaBuilderFormData {
  // Step 1: Idea Basics
  ideaName: string;
  ideaDescription: string;
  category: IdeaCategory[];
  priority: IdeaPriority;

  // Step 2: Target Audience
  targetAudience: IdeaAudience[];
  audienceSize: AudienceSize;
  demographicAge: DemographicAge[];
  demographicLocation: GeographicScope[];

  // Step 3: Problem & Solution
  problemStatement: string;
  solutionApproach: SolutionApproach[];
  competitorAnalysis: CompetitionLevel;
  uniqueValueProp: string;

  // Step 4: Implementation
  timeframe: Timeframe;
  budget: BudgetRange;
  resources: ResourceRequirement[];
  skillsRequired: SkillCategory[];

  // Step 5: Goals & Metrics
  primaryGoal: PrimaryGoal[];
  successMetrics: SuccessMetric[];
  expectedOutcome: string;
  riskAssessment: RiskLevel;
}

// Import shared types for consistency
import type { SelectOption } from "./shared";

/**
 * @deprecated Use SelectOption from "./shared" instead
 * Kept for backwards compatibility
 */
export interface IdeaBuilderOption extends SelectOption {}

/**
 * Wizard step configuration
 */
export interface IdeaBuilderStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  fields: (keyof IdeaBuilderFormData)[];
}

/**
 * Validation result for form steps
 */
export interface IdeaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Enhanced IdeaData interface that extends the basic data table interface
 */
export interface EnhancedIdeaData {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  tags: string[];
  created: string;
  lastModified: string;
  assignee: string;
  estimatedEffort: string;
  // Additional fields for enhanced idea tracking
  score?: number;
  ranking?: string;
  updated?: string;
  author?: string;
  contentType?: string;
}

// ============================================================================
// CONSTANT OPTION ARRAYS
// ============================================================================

export const IDEA_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Technology", value: "technology" },
  { label: "Business", value: "business" },
  { label: "Marketing", value: "marketing" },
  { label: "Product", value: "product" },
  { label: "Service", value: "service" },
  { label: "Process Improvement", value: "process" },
  { label: "Innovation", value: "innovation" },
];

export const IDEA_PRIORITY_OPTIONS: SelectOption[] = [
  { label: "Low - Nice to have", value: "low" },
  { label: "Medium - Important", value: "medium" },
  { label: "High - Critical", value: "high" },
  { label: "Urgent - Must do now", value: "urgent" },
];

export const TARGET_AUDIENCE_OPTIONS: SelectOption[] = [
  { label: "General Consumers", value: "consumers" },
  { label: "Small Businesses", value: "businesses" },
  { label: "Enterprise/Large Corporations", value: "enterprise" },
  { label: "Students/Education", value: "students" },
  { label: "Working Professionals", value: "professionals" },
  { label: "Senior Citizens", value: "seniors" },
  { label: "Teenagers", value: "teens" },
  { label: "Parents/Families", value: "parents" },
];

export const DEMOGRAPHIC_AGE_OPTIONS: SelectOption[] = [
  { label: "Gen Z (18-27)", value: "gen-z" },
  { label: "Millennial (28-43)", value: "millennial" },
  { label: "Gen X (44-59)", value: "gen-x" },
  { label: "Baby Boomer (60+)", value: "boomer" },
  { label: "All Age Groups", value: "all-ages" },
];

export const DEMOGRAPHIC_LOCATION_OPTIONS: SelectOption[] = [
  { label: "Local/City", value: "local" },
  { label: "Regional/State", value: "regional" },
  { label: "National", value: "national" },
  { label: "Global/International", value: "global" },
];

export const SOLUTION_APPROACH_OPTIONS: SelectOption[] = [
  { label: "Software/App Solution", value: "software" },
  { label: "Service-based Solution", value: "service" },
  { label: "Physical Product", value: "product" },
  { label: "Process Improvement", value: "process" },
  { label: "Platform/Marketplace", value: "platform" },
  { label: "Automation/AI", value: "automation" },
];

export const RESOURCES_OPTIONS: SelectOption[] = [
  { label: "Just myself", value: "self" },
  { label: "Small team (2-3 people)", value: "small-team" },
  { label: "Team (4-10 people)", value: "team" },
  { label: "Large team (10+ people)", value: "large-team" },
  { label: "External partners/vendors", value: "external" },
];

export const SKILLS_REQUIRED_OPTIONS: SelectOption[] = [
  { label: "Technical/Development", value: "technical" },
  { label: "Design/UX", value: "design" },
  { label: "Marketing/Sales", value: "marketing" },
  { label: "Business Strategy", value: "business" },
  { label: "Operations/Management", value: "operations" },
];

export const PRIMARY_GOAL_OPTIONS: SelectOption[] = [
  { label: "Generate Revenue", value: "revenue" },
  { label: "Acquire Users/Customers", value: "users" },
  { label: "Improve Efficiency", value: "efficiency" },
  { label: "Build Brand Awareness", value: "brand" },
  { label: "Solve a Problem", value: "problem-solving" },
  { label: "Learning/Experience", value: "learning" },
  { label: "Social Impact", value: "impact" },
];

export const SUCCESS_METRICS_OPTIONS: SelectOption[] = [
  { label: "Monthly/Annual Revenue", value: "revenue" },
  { label: "User/Customer Count", value: "users" },
  { label: "User Engagement Metrics", value: "engagement" },
  { label: "Customer Satisfaction", value: "satisfaction" },
  { label: "Efficiency Improvements", value: "efficiency" },
  { label: "Market Share", value: "market-share" },
  { label: "Return on Investment", value: "roi" },
];

export const AUDIENCE_SIZE_OPTIONS: SelectOption[] = [
  { label: "Small (< 1,000 people)", value: "small" },
  { label: "Medium (1K - 10K people)", value: "medium" },
  { label: "Large (10K - 100K people)", value: "large" },
  { label: "Massive (100K+ people)", value: "massive" },
];

export const COMPETITION_ANALYSIS_OPTIONS: SelectOption[] = [
  { label: "No direct competitors", value: "none" },
  { label: "Few competitors (1-3)", value: "few" },
  { label: "Some competitors (4-10)", value: "some" },
  { label: "Many competitors (10+)", value: "many" },
  { label: "Market is saturated", value: "saturated" },
];

export const TIMEFRAME_OPTIONS: SelectOption[] = [
  { label: "1 Week or less", value: "1-week" },
  { label: "2-4 Weeks", value: "2-4-weeks" },
  { label: "1-3 Months", value: "1-3-months" },
  { label: "3-6 Months", value: "3-6-months" },
  { label: "6-12 Months", value: "6-12-months" },
  { label: "1+ Years", value: "1-year-plus" },
];

export const BUDGET_OPTIONS: SelectOption[] = [
  { label: "Minimal ($0 - $1K)", value: "minimal" },
  { label: "Low ($1K - $5K)", value: "low" },
  { label: "Medium ($5K - $25K)", value: "medium" },
  { label: "High ($25K - $100K)", value: "high" },
  { label: "Enterprise ($100K+)", value: "enterprise" },
];

export const RISK_ASSESSMENT_OPTIONS: SelectOption[] = [
  { label: "Low Risk - Safe bet", value: "low" },
  { label: "Medium Risk - Calculated risk", value: "medium" },
  { label: "High Risk - Big potential payoff", value: "high" },
  { label: "Experimental - Learning opportunity", value: "experimental" },
];

// ============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

/**
 * Type guard to check if a value is a valid IdeaPriority
 */
export const isValidIdeaPriority = (value: string): value is IdeaPriority => {
  return ["low", "medium", "high", "urgent"].includes(value);
};

/**
 * Type guard to check if a value is a valid IdeaCategory
 */
export const isValidIdeaCategory = (value: string): value is IdeaCategory => {
  return IDEA_CATEGORY_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid AudienceSize
 */
export const isValidAudienceSize = (value: string): value is AudienceSize => {
  return ["small", "medium", "large", "massive"].includes(value);
};

/**
 * Type guard to check if a value is a valid CompetitionLevel
 */
export const isValidCompetitionLevel = (
  value: string,
): value is CompetitionLevel => {
  return ["none", "few", "some", "many", "saturated"].includes(value);
};

/**
 * Type guard to check if a value is a valid Timeframe
 */
export const isValidTimeframe = (value: string): value is Timeframe => {
  return TIMEFRAME_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid BudgetRange
 */
export const isValidBudgetRange = (value: string): value is BudgetRange => {
  return BUDGET_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid RiskLevel
 */
export const isValidRiskLevel = (value: string): value is RiskLevel => {
  return RISK_ASSESSMENT_OPTIONS.some((option) => option.value === value);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create initial form data with proper types
 */
export const createInitialIdeaFormData = (): IdeaBuilderFormData => ({
  ideaName: "",
  ideaDescription: "",
  category: [],
  priority: "medium",
  targetAudience: [],
  audienceSize: "medium",
  demographicAge: [],
  demographicLocation: [],
  problemStatement: "",
  solutionApproach: [],
  competitorAnalysis: "some",
  uniqueValueProp: "",
  timeframe: "1-3-months",
  budget: "medium",
  resources: [],
  skillsRequired: [],
  primaryGoal: [],
  successMetrics: [],
  expectedOutcome: "",
  riskAssessment: "medium",
});

/**
 * Validate idea form data
 */
export const validateIdeaFormData = (
  data: Partial<IdeaBuilderFormData>,
): IdeaValidationResult => {
  const errors: string[] = [];

  if (!data.ideaName?.trim()) {
    errors.push("Idea name is required");
  }

  if (!data.ideaDescription?.trim()) {
    errors.push("Idea description is required");
  }

  if (!data.category?.length) {
    errors.push("At least one category must be selected");
  }

  if (!data.priority) {
    errors.push("Priority level is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
