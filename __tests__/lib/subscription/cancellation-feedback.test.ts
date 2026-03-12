/**
 * Unit Tests for buildCancellationReason
 *
 * Covers: empty inputs, normal serialization, and backend 500-char truncation.
 */

import { buildCancellationReason } from "@/lib/subscription/cancellation-feedback";

describe("buildCancellationReason", () => {
  // ---------------------------------------------------------------------------
  // Empty / blank inputs
  // ---------------------------------------------------------------------------

  it("returns undefined when both reasons and feedback are empty", () => {
    expect(buildCancellationReason([], "")).toBeUndefined();
  });

  it("returns undefined when reasons array contains only whitespace strings", () => {
    expect(buildCancellationReason(["  ", "\t", ""], "")).toBeUndefined();
  });

  it("returns undefined when feedback is only whitespace and reasons are empty", () => {
    expect(buildCancellationReason([], "   ")).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Reasons only
  // ---------------------------------------------------------------------------

  it("returns only the reasons part when feedback is empty", () => {
    expect(
      buildCancellationReason(["Too expensive", "Missing features"], ""),
    ).toBe("Reasons: Too expensive, Missing features");
  });

  it("handles a single reason correctly", () => {
    expect(buildCancellationReason(["Other"], "")).toBe("Reasons: Other");
  });

  it("trims whitespace from individual reason strings", () => {
    expect(buildCancellationReason(["  Too expensive  ", " Other "], "")).toBe(
      "Reasons: Too expensive, Other",
    );
  });

  // ---------------------------------------------------------------------------
  // Feedback only
  // ---------------------------------------------------------------------------

  it("returns only the feedback part when reasons array is empty", () => {
    expect(buildCancellationReason([], "Need SSO")).toBe("Feedback: Need SSO");
  });

  it("trims whitespace from feedback", () => {
    expect(buildCancellationReason([], "  Need SSO  ")).toBe(
      "Feedback: Need SSO",
    );
  });

  // ---------------------------------------------------------------------------
  // Combined reasons + feedback
  // ---------------------------------------------------------------------------

  it("combines reasons and feedback in API-safe format", () => {
    expect(
      buildCancellationReason(
        ["Too expensive", "Missing features"],
        "Need SSO",
      ),
    ).toBe("Reasons: Too expensive, Missing features | Feedback: Need SSO");
  });

  it("uses pipe delimiter between reasons and feedback sections", () => {
    const result = buildCancellationReason(["Other"], "Some feedback");
    expect(result).toContain(" | ");
  });

  // ---------------------------------------------------------------------------
  // Backend 500-char constraint
  // ---------------------------------------------------------------------------

  it("truncates payload to backend 500-char limit", () => {
    const longFeedback = "x".repeat(2000);
    const value = buildCancellationReason(["Other"], longFeedback);
    expect(value).toBeDefined();
    expect(value?.length).toBeLessThanOrEqual(500);
  });

  it("truncates reasons-only string exceeding 500 chars", () => {
    const longReason = "a".repeat(600);
    const value = buildCancellationReason([longReason], "");
    expect(value).toBeDefined();
    expect(value?.length).toBeLessThanOrEqual(500);
  });

  it("returns exact 500 chars when input is exactly at the limit", () => {
    // "Feedback: " prefix is 10 chars; fill the remaining 490 with 'z'
    const feedback = "z".repeat(490);
    const value = buildCancellationReason([], feedback);
    expect(value).toBeDefined();
    expect(value?.length).toBe(500);
  });

  it("returns string shorter than 500 chars for short inputs", () => {
    const value = buildCancellationReason(["Too expensive"], "Short feedback");
    expect(value).toBeDefined();
    expect(value?.length).toBeLessThan(500);
  });
});
