import { z } from "zod";

/**
 * Zod schema for operational SSE events.
 * Matches the backend OperationEvent schema from sse_service.py.
 */
export const SSEEventSchema = z.object({
    id: z.string(),
    operation_id: z.string(),
    scope: z.string(),
    step: z.string(),
    status: z.enum(["connected", "started", "progress", "completed", "failed", "info"]),
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