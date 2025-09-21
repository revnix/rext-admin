import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withApiMiddleware,
  createSuccessResponse,
  createErrorResponse,
  NotFoundError,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";
import { apiRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

// Schema for tasks data validation
const TasksResponseSchema = z.object({
  tasks: z.array(z.record(z.string(), z.unknown())).optional(),
  // Allow additional fields from taskmaster
}).passthrough();

export const GET = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "GET");

    // Apply rate limiting
    const identifier = getRateLimitIdentifier(request as NextRequest);
    const { success, remaining } = await apiRateLimiter.limit(identifier);

    if (!success) {
      return createErrorResponse(
        'Rate limit exceeded',
        'api_rate_limit_exceeded',
        context.requestId,
        429,
        'Too many requests. Please try again later.',
        60
      );
    }

    try {
      const tasksFilePath = join(
        process.cwd(),
        ".taskmaster",
        "tasks",
        "tasks.json",
      );

      const fileContent = await readFile(tasksFilePath, "utf-8");
      const tasksData = JSON.parse(fileContent);

      // Validate the tasks data structure
      const validatedData = TasksResponseSchema.parse(tasksData);

      const response = createSuccessResponse(validatedData, context.requestId, {
        generated_at: new Date().toISOString(),
      });

      // Set rate limit headers
      response.headers.set('X-RateLimit-Remaining', remaining.toString());

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes("ENOENT")) {
        throw new NotFoundError("Tasks file not found");
      }
      throw error;
    }
  },
  {
    enableLogging: true,
    requestIdPrefix: "tasks_api",
  },
);
