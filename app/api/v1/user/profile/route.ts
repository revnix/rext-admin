/**
 * User Profile API Routes
 *
 * Handles getting and updating user profile information
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  AuthenticationError,
  createErrorResponse,
  createSuccessResponse,
  parseJsonBody,
  withApiMiddleware,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";

// Profile update schema
const profileUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

/**
 * GET /api/v1/user/profile
 * Get current user's profile information
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
      const response = await fetch(`${backendUrl}/api/v1/user/profile`, {
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
          errorData.error || "Failed to fetch profile",
          errorData.error_code || "profile_fetch_failed",
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
    requestIdPrefix: "profile_get",
  },
);

/**
 * PATCH /api/v1/user/profile
 * Update current user's profile information
 */
export const PATCH = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "PATCH");

    // Get authenticated user session
    const session = await auth();
    if (!session?.user?.accessToken) {
      throw new AuthenticationError("Not authenticated");
    }

    // Parse and validate request body
    const data = await parseJsonBody(request as NextRequest, profileUpdateSchema);

    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      throw new Error("Backend API URL not configured");
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/user/profile`, {
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
          errorData.error || "Failed to update profile",
          errorData.error_code || "profile_update_failed",
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
    requestIdPrefix: "profile_update",
  },
);
