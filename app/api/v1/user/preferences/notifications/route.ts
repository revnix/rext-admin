/**
 * Notification Preferences API Routes
 *
 * Handles getting and updating user notification preferences
 */

import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  AuthenticationError,
  createErrorResponse,
  createSuccessResponse,
  parseJsonBody,
  withApiMiddleware,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";
import { notificationPreferencesSchema } from "@/schemas/notification-schemas";

/**
 * GET /api/v1/user/preferences/notifications
 * Get current user's notification preferences
 */
export const GET = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "GET");

    // Get authenticated user session
    const session = await auth();
    if (!session?.user?.accessToken) {
      throw new AuthenticationError("Not authenticated");
    }

    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      throw new Error("Backend API URL not configured");
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/user/preferences/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
          "X-Request-ID": context.requestId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return createErrorResponse(
          errorData.error || "Failed to fetch notification preferences",
          errorData.error_code || "notification_preferences_fetch_failed",
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
    requestIdPrefix: "notification_prefs_get",
  },
);

/**
 * PATCH /api/v1/user/preferences/notifications
 * Update current user's notification preferences
 */
export const PATCH = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "PATCH");

    // Get authenticated user session
    const session = await auth();
    if (!session?.user?.accessToken) {
      throw new AuthenticationError("Not authenticated");
    }

    // Parse and validate request body (partial schema for PATCH)
    const data = await parseJsonBody(
      request as NextRequest,
      notificationPreferencesSchema.partial(),
    );

    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      throw new Error("Backend API URL not configured");
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/user/preferences/notifications`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
          "X-Request-ID": context.requestId,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return createErrorResponse(
          errorData.error || "Failed to update notification preferences",
          errorData.error_code || "notification_preferences_update_failed",
          context.requestId,
          response.status,
          errorData.details,
        );
      }

      const responseData = await response.json();
      return createSuccessResponse(responseData.data || responseData, context.requestId);
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
    requestIdPrefix: "notification_prefs_update",
  },
);
