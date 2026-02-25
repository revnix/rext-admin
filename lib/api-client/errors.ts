import type { WorkspaceErrorCode } from "@/types/workspace";

export class WorkspaceServiceError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "WorkspaceServiceError";
  }

  static fromResponse(
    response: unknown,
    statusCode: number,
  ): WorkspaceServiceError {
    const responseObj = response as Record<string, unknown>;
    const code =
      (responseObj.error_code as WorkspaceErrorCode) || "INVALID_REQUEST";
    const message =
      (responseObj.error as string) || "An unknown error occurred";
    const details = (responseObj.details as Record<string, unknown>) || {};

    return new WorkspaceServiceError(code, message, details, statusCode);
  }
}
