/**
 * The article's structure beside it (task 703): heading levels, and what is written, being
 * written and still to come.
 */

import {
  articleStructure,
  plannedSections,
  writingPosition,
} from "@/lib/generate-content/article-structure";

const outline = [
  { heading: "Pick a show idea" },
  { heading: "Choose one listener", heading_level: "H3" as const },
  { heading: "Choose a format" },
  { heading: "The gear you need" },
  { heading: "Microphones under $100", heading_level: "H3" as const },
  { heading: "Questions beginners ask" },
];

describe("articleStructure", () => {
  it("lists a finished article's headings with their levels, all done", () => {
    const body =
      "Intro.\n\n## Pick a show idea\n\nText.\n\n### Choose one listener\n\nText.\n\n## Choose a format\n";
    expect(articleStructure(body, outline, false)).toEqual([
      { level: 2, heading: "Pick a show idea", state: "done" },
      { level: 3, heading: "Choose one listener", state: "done" },
      { level: 2, heading: "Choose a format", state: "done" },
    ]);
  });

  it("marks the last heading as being written, and lists the outline's rest as waiting", () => {
    const body =
      "Intro.\n\n## 1. Pick a show idea\n\nText.\n\n### Choose one listener\n\nText.\n\n## **Choose a format**\n\nA solo";
    const entries = articleStructure(body, outline, true);
    expect(entries.map((e) => `${e.level} ${e.heading}: ${e.state}`)).toEqual([
      "2 1. Pick a show idea: done",
      "3 Choose one listener: done",
      "2 Choose a format: writing",
      "2 The gear you need: waiting",
      "3 Microphones under $100: waiting",
      "2 Questions beginners ask: waiting",
    ]);
  });

  it("shows the whole outline as waiting before the first heading is written", () => {
    const entries = articleStructure("An opening line", outline, true);
    expect(entries).toHaveLength(6);
    expect(entries.every((e) => e.state === "waiting")).toBe(true);
  });

  it("takes a reworded heading as written once a later one has arrived", () => {
    const body =
      "## Find your show idea\n\nText.\n\n## Choose a format\n\nText";
    const entries = articleStructure(body, outline, true);
    expect(entries.map((e) => e.heading)).toEqual([
      "Find your show idea",
      "Choose a format",
      "The gear you need",
      "Microphones under $100",
      "Questions beginners ask",
    ]);
  });

  it("lists nothing waiting when there is no outline", () => {
    expect(articleStructure("## One\n\ntext", [], true)).toEqual([
      { level: 2, heading: "One", state: "writing" },
    ]);
    expect(articleStructure("", [], true)).toEqual([]);
  });

  it("leaves deeper headings out, and lists a body's own h1 with the sections", () => {
    const body = "# Title again\n\n## One\n\n#### Detail\n\n### Two\n";
    expect(
      articleStructure(body, [], false).map((e) => `${e.level} ${e.heading}`),
    ).toEqual(["2 Title again", "2 One", "3 Two"]);
  });
});

describe("writingPosition", () => {
  it("counts main sections: the one being written of all planned", () => {
    const body = "## Pick a show idea\n\nText.\n\n## Choose a format\n\nA solo";
    expect(writingPosition(articleStructure(body, outline, true))).toEqual({
      section: 2,
      sections: 4,
    });
  });
});

describe("plannedSections", () => {
  it("reads a flat list of sections, with their levels", () => {
    expect(
      plannedSections({
        sections: [
          { heading: "One" },
          { heading: "Two", heading_level: "H3" },
          { heading: "  " },
          "not a section",
        ],
      }),
    ).toEqual([
      { heading: "One", heading_level: "H2" },
      { heading: "Two", heading_level: "H3" },
    ]);
  });

  it("finds a blog's sections a level down", () => {
    expect(
      plannedSections({
        title: "x",
        structure: { sections: [{ heading: "Gear", heading_level: "H2" }] },
      }),
    ).toEqual([{ heading: "Gear", heading_level: "H2" }]);
  });

  it("lists an outline planned in blocks (a how-to's steps) by block, its items under it", () => {
    expect(
      plannedSections({
        steps: { steps: [{ title: "Gather" }] },
        _render: {
          blocks: [
            {
              heading: "Steps",
              items: [
                { label: "Gather your gear", points: [] },
                { label: "Record a test", points: ["One minute"] },
              ],
            },
            { heading: "Empty block", items: [] },
            { heading: "Tools", items: [{ label: "A USB microphone" }] },
          ],
        },
      }),
    ).toEqual([
      { heading: "Steps", heading_level: "H2" },
      { heading: "Gather your gear", heading_level: "H3" },
      { heading: "Record a test", heading_level: "H3" },
      { heading: "Tools", heading_level: "H2" },
      { heading: "A USB microphone", heading_level: "H3" },
    ]);
  });

  it("gives none for an outline with nothing to list, or no outline", () => {
    expect(
      plannedSections({ steps: { steps: [{ title: "Gather" }] } }),
    ).toEqual([]);
    expect(plannedSections(null)).toEqual([]);
  });
});
