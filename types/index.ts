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
// CONTENT CREATION TYPES
// ============================================================================
export type {
  AudienceSize,
  ContentCreationFormData,
  ContentCreationWizardProps,
  ContentFreshness,
  ContentLengthOption,
  ContentTypeForPlatform,
  ContentTypeOptions,
  CreateContentRequest,
  CreateContentResponse,
  FactCheckingLevel,
  FieldDependency,
  PartialContentCreationFormData,
  Platform,
  ReadingLevel,
  ResearchLevel,
  WizardAction,
  WizardConfig,
  WizardField,
  WizardProgressProps,
  WizardState,
  WizardStep,
  WizardStepProps,
} from "./content-creation";
export {
  getDefaultFormData,
  isCompleteFormData,
} from "./content-creation";
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
  CurrentStep,
  GeneratedTopic,
  Industry,
  PurposeType,
  StepHistory,
  TopicBuilderDraft,
  TopicBuilderFormData,
  TopicGenerationRequest,
  TopicGenerationResponse,
  TypeFormWizardState,
  WizardMode,
  WizardStep as TopicBuilderWizardStep,
} from "./topic-builder";
// Export option constants for Topic Builder
// Export helper functions
// Export option constants for Topic Builder
// ============================================================================
// TYPE GUARDS
// ============================================================================
export {
  INDUSTRY_OPTIONS,
  isValidIndustry,
  isValidPurposeType,
  isValidWizardMode,
  PURPOSE_OPTIONS,
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
export type TopicBuilderOption = import("./shared").SelectOption;
