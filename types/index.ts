/**
 * Types Index - Centralized Type Exports
 *
 * This module provides centralized exports for all types used throughout
 * the application, making imports cleaner and more maintainable.
 */

// ============================================================================
// API TYPES
// ============================================================================
export type {
  ApiClientConfig,
  ApiRequestOptions,
  ApiResponse,
  ApiStatus,
  ApiValidationResult,
  ClientError,
  CreateSessionRequest,
  CreateSessionResponse,
  ErrorResponse,
  ExportTopicsRequest,
  ExportTopicsResponse,
  HttpStatusCode,
  PaginatedResponse,
  SaveTopicsRequest,
  SaveTopicsResponse,
  TopicGenerationRequest as ApiTopicGenerationRequest,
  TopicGenerationResponse as ApiTopicGenerationResponse,
  TopicRegenerationRequest,
  TopicRegenerationResponse,
  TopicSession,
  ValidationError,
  ValidationWarning,
} from "./api";
// Export API helper functions
export {
  createErrorResponse,
  createTimestamp,
  generateRequestId,
  generateSessionId,
  isErrorResponse,
  isSuccessfulApiResponse,
  isValidApiStatus,
  isValidTopicGenerationRequest,
} from "./api";
// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================
export type {
  AsyncStateProps,
  AudienceSelectionProps,
  BulkActionProps,
  ButtonProps,
  CollapsibleSectionProps,
  ControllableProps,
  EmptyStateProps,
  ErrorStateProps,
  FlowSelectionProps,
  FormEventHandlers,
  FormFieldProps,
  FormNavigationProps,
  FormStepProps,
  ForwardableProps,
  IndustrySelectionProps,
  InputProps,
  LoadingSpinnerProps,
  LoadingStateProps,
  MultiSelectProps,
  PreferenceToggleProps,
  ResultsEventHandlers,
  SelectProps,
  StepIndicatorProps,
  TextareaProps,
  TopicBuilderFormProps,
  TopicCardProps,
  TopicFilterProps,
  TopicFilters,
  TopicResultsProps,
  TopicSortProps,
} from "./components";
export {
  hasErrorState,
  hasLoadingState,
  isErrorResponse as isComponentErrorResponse,
} from "./components";
// ============================================================================
// DATA TABLE TYPES
// ============================================================================
export type {
  ContentData,
  FlowData,
  IdeaData,
  MemoryData,
  ModelData,
  NotificationConfiguration,
  NotificationData,
  PromptTemplateData,
  RowAction,
  RuleData,
  SocialAccountData,
  TableAction,
  UserData,
} from "./data-table";
// ============================================================================
// IDEA BUILDER TYPES
// ============================================================================
export type {
  BudgetRange,
  CompetitionLevel,
  DemographicAge,
  EnhancedIdeaData,
  GeographicScope,
  IdeaAudience,
  IdeaBuilderFormData,
  IdeaBuilderStep,
  IdeaCategory,
  IdeaPriority,
  IdeaValidationResult,
  PrimaryGoal,
  ResourceRequirement,
  RiskLevel,
  SkillCategory,
  SolutionApproach,
  SuccessMetric,
  Timeframe,
} from "./idea-builder";
// Export option constants for Idea Builder
// Export helper functions
export {
  AUDIENCE_SIZE_OPTIONS as IDEA_AUDIENCE_SIZE_OPTIONS,
  BUDGET_OPTIONS,
  COMPETITION_ANALYSIS_OPTIONS,
  createInitialIdeaFormData,
  DEMOGRAPHIC_AGE_OPTIONS,
  DEMOGRAPHIC_LOCATION_OPTIONS,
  IDEA_CATEGORY_OPTIONS,
  IDEA_PRIORITY_OPTIONS,
  isValidBudgetRange,
  isValidCompetitionLevel,
  isValidIdeaCategory,
  isValidIdeaPriority,
  isValidRiskLevel,
  isValidTimeframe,
  PRIMARY_GOAL_OPTIONS,
  RESOURCES_OPTIONS,
  RISK_ASSESSMENT_OPTIONS,
  SKILLS_REQUIRED_OPTIONS,
  SOLUTION_APPROACH_OPTIONS,
  SUCCESS_METRICS_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  TIMEFRAME_OPTIONS,
  validateIdeaFormData,
} from "./idea-builder";
// ============================================================================
// SHARED TYPES
// ============================================================================
export type {
  AsyncState,
  BaseTableRow,
  ChangeHandler,
  ClickHandler,
  DataTableEventHandlers,
  DialogEventHandlers,
  ErrorState,
  FieldValue,
  FilterState,
  FormFieldValue,
  IconComponent,
  IconProps,
  LoadingState,
  PaginationState,
  SelectHandler,
  SelectOption,
  SelectWithCustomOption,
  SortState,
  SubmitHandler,
  ValidationResult,
} from "./shared";
// ============================================================================
// TOPIC BUILDER TYPES
// ============================================================================
export type {
  AudienceSize,
  ContentGoalType,
  ContentType,
  GeneratedTopic,
  Industry,
  Language,
  OriginalityToggle,
  Platform,
  PreferenceToggle,
  PurposeType,
  ReaderLevel,
  Region,
  ToneType,
  TopicBuilderDraft,
  TopicBuilderFormData,
  TopicGenerationRequest,
  TopicGenerationResponse,
  WizardMode,
  WizardStep,
} from "./topic-builder";
// Export option constants for Topic Builder
// ============================================================================
// TYPE GUARDS
// ============================================================================
export {
  AUDIENCE_SIZE_OPTIONS,
  CONTENT_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  isValidAudienceSize,
  isValidContentGoalType,
  isValidContentType,
  isValidIndustry,
  isValidLanguage,
  isValidOriginalityToggle,
  isValidPlatform,
  isValidPreferenceToggle,
  isValidPurposeType,
  isValidReaderLevel,
  isValidRegion,
  isValidToneType,
  isValidWizardMode,
  LANGUAGE_OPTIONS,
  ORIGINALITY_TOGGLE_OPTIONS,
  PLATFORM_OPTIONS,
  PREFERENCE_TOGGLE_OPTIONS,
  PURPOSE_OPTIONS,
  READER_LEVEL_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
  validateEnumArray,
  WIZARD_MODE_OPTIONS,
} from "./topic-builder";

// ============================================================================
// DEPRECATED ALIASES (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use SelectOption from shared types instead
 */
export type { MultiSelectOption } from "./topic-builder";

/**
 * @deprecated Use SelectOption from shared types instead
 */
export type IdeaBuilderOption = import("./shared").SelectOption;
