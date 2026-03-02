import { ApiError } from "@/lib/api-client";

export type AvatarOperation = "upload" | "delete";

export function getAvatarErrorMessage(
  error: unknown,
  operation: AvatarOperation,
): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 413) {
      return "Avatar file is too large. Please use an image smaller than 5MB.";
    }

    if (error.statusCode === 415 || error.statusCode === 422) {
      return "Unsupported image format. Please upload JPEG, PNG, GIF, or WebP.";
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return "You are not allowed to modify this avatar. Please sign in again.";
    }

    if (error.statusCode >= 500) {
      return `Unable to ${operation} avatar right now. Please try again shortly.`;
    }
  }

  return `Failed to ${operation} avatar. Please try again.`;
}

export function getPrivacyExportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 429) {
      return "Too many export requests. Please wait a few minutes and try again.";
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return "Your session has expired or you do not have permission to export data.";
    }

    if (error.statusCode >= 500) {
      return "Data export is temporarily unavailable. Please try again later.";
    }
  }

  return "Failed to request data export. Please try again.";
}
