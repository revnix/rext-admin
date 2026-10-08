/**
 * The article's structure beside it (task 703): heading levels, and what is written, being
 * written and still to come.
 */

import {
  articleStructure,
  plannedSections,
  sameHeading,
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
    expect(articleStructure(body, [], false)[0].title).toBe(true);
  });
});

describe("articleStructure, headings that resemble one another", () => {
  it("doesn't take a later heading for an earlier one it contains", () => {
    const planned = [
      { heading: "Benefits" },
      { heading: "Costs" },
      { heading: "Benefits of a co-host" },
      { heading: "Next steps" },
    ];
    const entries = articleStructure("## Benefits\n\ntext", planned, true);
    expect(entries.map((e) => `${e.heading}: ${e.state}`)).toEqual([
      "Benefits: writing",
      "Costs: waiting",
      "Benefits of a co-host: waiting",
      "Next steps: waiting",
    ]);
  });

  it("matches a repeated heading in the outline's order", () => {
    const planned = [
      { heading: "Overview" },
      { heading: "Setup" },
      { heading: "Overview" },
      { heading: "Wrap up" },
    ];
    const entries = articleStructure("## Overview\n\ntext", planned, true);
    expect(entries.map((e) => e.heading)).toEqual([
      "Overview",
      "Setup",
      "Overview",
      "Wrap up",
    ]);
  });
});

describe("articleStructure, text that only looks like headings or differs from the plan", () => {
  it("leaves out lines inside fenced code", () => {
    const body = [
      "## Install it",
      "",
      "```sh",
      "# install the tool",
      "## not a heading",
      "```",
      "",
      "~~~",
      "### nor this",
      "~~~",
      "",
      "### After the code",
    ].join("\n");
    expect(articleStructure(body, [], false).map((e) => e.heading)).toEqual([
      "Install it",
      "After the code",
    ]);
  });

  it("doesn't list a reworded last section twice", () => {
    const planned = [
      { heading: "Pick a show idea" },
      { heading: "Choose a format" },
      { heading: "Questions beginners ask" },
      { heading: "How long should it be?", heading_level: "H3" as const },
    ];
    const body =
      "## Pick a show idea\n\nText.\n\n## Choose a format\n\nText.\n\n## What beginners want to know\n\nText";
    const entries = articleStructure(body, planned, true);
    expect(entries.map((e) => `${e.heading}: ${e.state}`)).toEqual([
      "Pick a show idea: done",
      "Choose a format: done",
      "What beginners want to know: writing",
      "How long should it be?: waiting",
    ]);
    expect(writingPosition(entries)).toEqual({ section: 3, sections: 3 });
  });
});

describe("sameHeading", () => {
  it("reads past numbering, marks and case, but not past other words", () => {
    expect(sameHeading("1. Pick a show idea", "**Pick a Show Idea**")).toBe(
      true,
    );
    expect(sameHeading("Benefits", "Benefits of a co-host")).toBe(false);
  });

  it("compares a heading with no words by its text", () => {
    expect(sameHeading("🎙️", " 🎙️ ")).toBe(true);
    expect(sameHeading("🎙️", "🎧")).toBe(false);
  });
});

describe("writingPosition", () => {
  it("leaves a body's own h1 out of the count", () => {
    const body = "# The title again\n\n## Pick a show idea\n\nText";
    expect(writingPosition(articleStructure(body, outline, true))).toEqual({
      section: 1,
      sections: 4,
    });
  });

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
