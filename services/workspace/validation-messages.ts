export const VALIDATION_MESSAGES = {
  // Common field validation
  FIELD_REQUIRED: (field: string) => `${field} is required` as const,
  FIELD_INVALID: (field: string, type: string) =>
    `${field} must be a valid ${type}` as const,
  FIELD_MAX_LENGTH: (field: string, max: number) =>
    `${field} must be ${max} characters or less` as const,
  FIELD_CANNOT_BE_EMPTY: (field: string) => `${field} is required` as const,

  // Workspace-specific
  TITLE_REQUIRED: "Title is required",
  TITLE_MAX_LENGTH: (max: number) =>
    `Title must be ${max} characters or less` as const,
  URL_REQUIRED: "A valid URL is required",
  INVALID_SLUG_FORMAT: "Invalid workspace slug format",

  // Knowledge-specific
  CONTENT_REQUIRED: "Content is required",
  FILE_REQUIRED: "A valid file is required",
  FILE_SIZE_EXCEEDED: (maxMB: number) =>
    `File size must be ${maxMB}MB or less` as const,
  UPDATE_FIELDS_REQUIRED:
    "At least one field (title, content, tags) must be provided",

  // Members-specific
  EMAIL_REQUIRED: "A valid email address is required",
  EMAILS_MIN_REQUIRED: "At least one email address is required",
  EMAILS_MAX_EXCEEDED: (max: number) =>
    `Maximum ${max} emails allowed per request` as const,
  INVITATION_TOKEN_REQUIRED: "Invitation token is required",

  // UUID validation
  INVALID_UUID: (field: string) =>
    `Invalid ${field}: must be a valid UUID` as const,
} as const;
