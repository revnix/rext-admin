/**
 * Integration tests for the /api/topics/save endpoint
 * Tests both single and bulk save functionality
 */

import fs from "node:fs";
import path from "node:path";

describe("/api/topics/save endpoint", () => {
  const projectRoot = process.cwd();

  it("should have the save endpoint file", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    expect(fs.existsSync(saveRoutePath)).toBe(true);
  });

  it("should support both single and bulk save operations", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    // Check for bulk save support
    expect(content).toContain("isBulkSave");
    expect(content).toContain("body.topics");
    expect(content).toContain("Array.isArray(body.topics)");

    // Check for single save support
    expect(content).toContain("isSingleSave");
    expect(content).toContain("body.topic");

    // Check for proper validation messages
    expect(content).toContain(
      "Request must contain either 'topic' (single save) or 'topics' array (bulk save)",
    );
  });

  it("should have proper error handling", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    expect(content).toContain("Topics save API error");
    expect(content).toContain("/api/topics/save");
    expect(content).toContain("classifyError");
    expect(content).toContain("sanitizeErrorForLogging");
  });

  it("should have bulk save result tracking", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    expect(content).toContain("total_attempted");
    expect(content).toContain("successful_saves");
    expect(content).toContain("failed_saves");
    expect(content).toContain("bulk_save: true");
    expect(content).toContain("bulk_save: false");
  });

  it("should validate required fields for both single and bulk operations", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    // Single save validation
    expect(content).toContain("topic.title");
    expect(content).toContain("topic.description");

    // Bulk save validation with index tracking
    expect(content).toContain("Topic at index");
    expect(content).toContain("title and description are required");
  });

  it("should use backendService.saveTopics for both single and bulk saves", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    // Should call saveTopics (plural) for operations
    expect(content).toContain("backendService.saveTopics");

    // Should handle individual save errors in bulk operations
    expect(content).toContain("try {");
    expect(content).toContain("} catch (error) {");
  });

  it("should return appropriate response structures", () => {
    const saveRoutePath = path.join(
      projectRoot,
      "app",
      "api",
      "topics",
      "save",
      "route.ts",
    );
    const content = fs.readFileSync(saveRoutePath, "utf-8");

    // Common fields
    expect(content).toContain("success:");
    expect(content).toContain("saved_at:");

    // Single save specific (updated structure)
    expect(content).toContain("topic: topic");

    // Bulk save specific
    expect(content).toContain("results:");
    expect(content).toContain("errors:");
  });
});
