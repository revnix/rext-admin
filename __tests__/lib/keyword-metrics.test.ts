import {
  difficultyBand,
  difficultyScore,
  keywordMetrics,
  parseIntents,
} from "@/lib/keywords/keyword-metrics";

describe("keyword metrics", () => {
  it("bands a difficulty as the gauge did: 10, 30 and 70 the edges", () => {
    expect(difficultyBand(0)).toBe("Easy");
    expect(difficultyBand(10)).toBe("Easy");
    expect(difficultyBand(11)).toBe("Medium");
    expect(difficultyBand(30)).toBe("Medium");
    expect(difficultyBand(70)).toBe("Hard");
    expect(difficultyBand(71)).toBe("Very hard");
    expect(difficultyBand(null)).toBeNull();
  });

  it("reads a difficulty as a number, an older run's object, or nothing", () => {
    expect(difficultyScore(41.6)).toBe(42);
    expect(difficultyScore("55")).toBe(55);
    expect(difficultyScore({ difficulty_score: 120 })).toBe(100);
    expect(difficultyScore(null)).toBeNull();
    expect(difficultyScore("")).toBeNull();
    expect(difficultyScore("hard")).toBeNull();
  });

  it("keeps the valid intents once each, the consensus first", () => {
    expect(parseIntents(["Commercial", "commercial", "informational"])).toEqual(
      ["commercial", "informational"],
    );
    expect(parseIntents("navigational")).toEqual(["navigational"]);
    expect(parseIntents(["unknown", 3, null])).toEqual([]);
  });

  it("reads the gate's seo_state, missing counts as unknown", () => {
    expect(
      keywordMetrics({
        keyword_difficulty: 42,
        intent: ["informational", "commercial"],
        volume: 1200,
        volume_status: "ok",
        backlinks: 0,
        referring_domains: null,
      }),
    ).toEqual({
      difficulty: 42,
      volume: 1200,
      volumeStatus: "ok",
      intents: ["informational", "commercial"],
      backlinks: 0,
      referringDomains: null,
    });
    expect(keywordMetrics(null).intents).toEqual([]);
  });
});
