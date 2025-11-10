/**
 * User Avatar Upload API Route
 *
 * Handles avatar image upload for current user
 */

import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  AuthenticationError,
  ValidationError,
  createErrorResponse,
  createSuccessResponse,
  withApiMiddleware,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/v1/user/avatar/upload
 * Upload user avatar image
 */
export const POST = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "POST");

    // Get authenticated user session
    const session = await auth();
    if (!session?.user?.accessToken) {
      throw new AuthenticationError("Not authenticated");
    }

    // Parse form data
    const formData = await (request as NextRequest).formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ValidationError("No file provided");
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new ValidationError(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        "File too large. Maximum size is 5MB.",
      );
    }

    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      throw new Error("Backend API URL not configured");
    }

    try {
      // Create new FormData for backend request
      const backendFormData = new FormData();
      backendFormData.append("file", file);

      const response = await fetch(`${backendUrl}/api/v1/user/avatar/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "X-Request-ID": context.requestId,
        },
        body: backendFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return createErrorResponse(
          errorData.error || "Failed to upload avatar",
          errorData.error_code || "avatar_upload_failed",
          context.requestId,
          response.status,
          errorData.details,
        );
      }

      const data = await response.json();
      return createSuccessResponse(data.data || data, context.requestId);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(
          "Failed to communicate with backend",
          "backend_communication_error",
          context.requestId,
          503,
          error.message,
        );
      }
      throw error;
    }
  },
  {
    enableLogging: true,
    requestIdPrefix: "avatar_upload",
  },
);
