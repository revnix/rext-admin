import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import {
  withApiMiddleware,
  createSuccessResponse,
  NotFoundError,
} from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";

// Schema for tasks data validation
const TasksResponseSchema = z.object({
  tasks: z.array(z.record(z.string(), z.unknown())).optional(),
  // Allow additional fields from taskmaster
}).passthrough();

export const GET = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "GET");

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

      return createSuccessResponse(validatedData, context.requestId, {
        generated_at: new Date().toISOString(),
      });
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
