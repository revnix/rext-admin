import { z } from "zod";
import { SSE_EVENT_STATUSES } from "@/types/sse";

/**
 * Zod schema for operational SSE events.
 * Matches the backend OperationEvent schema from sse_service.py.
 * Uses the shared SSE_EVENT_STATUSES const for single-source-of-truth status values.
 */
export const SSEEventSchema = z.object({
  id: z.string(),
  operation_id: z.string(),
  scope: z.string(),
  step: z.string(),
  status: z.enum(SSE_EVENT_STATUSES),
  message: z.string(),
  progress: z.number().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});

export type ValidatedSSEEvent = z.infer<typeof SSEEventSchema>;

/**
 * Zod schema for LangGraph RunStreamEvent.
 * Validates the basic structure; the `data` field is intentionally
 * loosely typed since its shape varies by event type.
 */
export const RunStreamEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
});

export type ValidatedRunStreamEvent = z.infer<typeof RunStreamEventSchema>;
