/**
 * User Avatar Delete API Route
 *
 * Handles deletion of user avatar image
 */

import { auth } from "@/auth";
import {
  AuthenticationError,
  createErrorResponse,
  createSuccessResponse,
  withApiMiddleware,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";

/**
 * DELETE /api/v1/user/avatar
 * Delete user's avatar image
 */
export const DELETE = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "DELETE");

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
      const response = await fetch(`${backendUrl}/api/v1/user/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
          "X-Request-ID": context.requestId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return createErrorResponse(
          errorData.error || "Failed to delete avatar",
          errorData.error_code || "avatar_delete_failed",
          context.requestId,
          response.status,
          errorData.details,
        );
      }

      // Return 204 No Content on success
      return createSuccessResponse(
        { message: "Avatar deleted successfully" },
        context.requestId,
      );
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
    requestIdPrefix: "avatar_delete",
  },
);
