import { describe, expect, it } from "@jest/globals";
import {
  transformTopicForBackend,
  transformTopicsForBackend,
} from "@/lib/transformation-utils";
import type { GeneratedTopic } from "@/types/topic-builder";

const baseTopic: GeneratedTopic = {
  id: "topic-1",
  title: "AI content strategy",
  angle: "Focus on practical adoption milestones",
  description: "Step-by-step strategy for adopting AI in marketing teams.",
  channel_fit: ["blog", "newsletter"],
  audience_fit: ["marketing-managers"],
  why_it_works: "Highlights measurable wins and mitigates risk concerns.",
  scores: {
    relevance: 0.9,
    seo_potential: 0.8,
    trend_level: 0.7,
    uniqueness: 0.6,
    reader_interest: 0.85,
    actionable_potential: 0.75,
    brand_alignment: 0.8,
    controversy: 0.2,
  },
  tags: ["ai", "marketing"],
  created_at: "2025-01-01T00:00:00.000Z",
  is_saved: false,
};

describe("transformTopicForBackend", () => {
  it("maps a generated topic to the backend payload", () => {
    const result = transformTopicForBackend(baseTopic);

    expect(result).toEqual({
      id: baseTopic.id,
      title: baseTopic.title,
      angle: baseTopic.angle,
      description: baseTopic.description,
      channel_fit: baseTopic.channel_fit,
      audience_fit: baseTopic.audience_fit,
      why_it_works: baseTopic.why_it_works,
      tags: baseTopic.tags,
      scores: baseTopic.scores,
      suggested_defaults: {},
      input_params: undefined,
    });
  });

  it("falls back to title when description is missing and normalises nullable fields", () => {
    const topicWithoutOptionalFields: GeneratedTopic = {
      ...baseTopic,
      description: undefined,
      channel_fit: [],
      audience_fit: [],
      why_it_works: "",
      tags: [],
    };

    const result = transformTopicForBackend(topicWithoutOptionalFields);

    expect(result.description).toBe(topicWithoutOptionalFields.title);
    expect(result.channel_fit).toEqual([]);
    expect(result.audience_fit).toEqual([]);
    expect(result.why_it_works).toBe("");
    expect(result.tags).toEqual([]);
  });
});

describe("transformTopicsForBackend", () => {
  it("wraps multiple topics in the backend request structure", () => {
    const result = transformTopicsForBackend([baseTopic]);

    expect(result).toEqual({
      topics: [transformTopicForBackend(baseTopic)],
    });
  });

  it("handles an empty list", () => {
    expect(transformTopicsForBackend([])).toEqual({ topics: [] });
  });
});
