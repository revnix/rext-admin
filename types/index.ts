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
  MemoryData,
  ModelData,
  NotificationConfiguration,
  NotificationData,
  PromptTemplateData,
  RowAction,
  RuleData,
  SocialAccountData,
  TableAction,
  TopicData,
  UserData,
} from "./data-table";
// ============================================================================
// SESSION STORAGE TYPES
// ============================================================================
export type {
  SessionData,
  SessionMetadata,
  SessionStorageAPI,
} from "./session";
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
// ============================================================================
// TOPIC BUILDER TYPES
// ============================================================================
export type {
  BudgetRange,
  CompetitionLevel,
  ContentType,
  DemographicAge,
  EnhancedTopicData,
  GeneratedTopic,
  GeographicScope,
  Industry,
  Platform,
  PrimaryGoal,
  PurposeType,
  ResourceRequirement,
  RiskLevel,
  SkillCategory,
  SolutionApproach,
  SuccessMetric,
  Timeframe,
  ToneType,
  TopicAudience,
  TopicBuilderDraft,
  TopicBuilderFormData,
  TopicBuilderFormData,
  TopicBuilderStep,
  TopicCategory,
  TopicGenerationRequest,
  TopicGenerationResponse,
  TopicPriority,
  TopicValidationResult,
  WizardMode,
  WizardStep,
} from "./topic-builder";
// Export option constants for Topic Builder
// Export helper functions
// Export option constants for Topic Builder
// ============================================================================
// TYPE GUARDS
// ============================================================================
export {
  AUDIENCE_SIZE_OPTIONS as TOPIC_AUDIENCE_SIZE_OPTIONS,
  BUDGET_OPTIONS,
  COMPETITION_ANALYSIS_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  createInitialTopicFormData,
  DEMOGRAPHIC_AGE_OPTIONS,
  DEMOGRAPHIC_LOCATION_OPTIONS,
  INDUSTRY_OPTIONS,
  isValidBudgetRange,
  isValidCompetitionLevel,
  isValidContentType,
  isValidIndustry,
  isValidPlatform,
  isValidPurposeType,
  isValidRiskLevel,
  isValidTimeframe,
  isValidToneType,
  isValidTopicCategory,
  isValidTopicPriority,
  isValidWizardMode,
  PLATFORM_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  PURPOSE_OPTIONS,
  RESOURCES_OPTIONS,
  RISK_ASSESSMENT_OPTIONS,
  SKILLS_REQUIRED_OPTIONS,
  SOLUTION_APPROACH_OPTIONS,
  SUCCESS_METRICS_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  TIMEFRAME_OPTIONS,
  TONE_OPTIONS,
  TOPIC_CATEGORY_OPTIONS,
  TOPIC_PRIORITY_OPTIONS,
  validateEnumArray,
  validateTopicFormData,
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
export type TopicBuilderOption = import("./shared").SelectOption;
