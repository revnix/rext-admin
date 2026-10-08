import {
  type DraftSection,
  readSectionEvent,
  sectionsInOrder,
  sectionsMarkdown,
  withSection,
} from "@/lib/generate-content/draft-sections";

const event = (over: Record<string, unknown> = {}) => ({
  type: "section",
  phase: "draft",
  key: "structure_1",
  index: 2,
  of: 10,
  level: 2,
  heading: "Start with the core kit",
  markdown: "A microphone and a quiet room.",
  ...over,
});

const section = (index: number, over: Partial<DraftSection> = {}) => ({
  index,
  level: 2 as const,
  heading: `Section ${index}`,
  markdown: `Text ${index}.`,
  ...over,
});

describe("the first draft's sections (task 773, part B)", () => {
  describe("readSectionEvent", () => {
    it("reads a section as the stream sends it", () => {
      expect(readSectionEvent(event())).toEqual({
        index: 2,
        level: 2,
        heading: "Start with the core kit",
        markdown: "A microphone and a quiet room.",
      });
    });

    it("keeps the levels an article has, and takes any other as a main section", () => {
      expect(readSectionEvent(event({ level: 3 }))?.level).toBe(3);
      expect(readSectionEvent(event({ level: 4 }))?.level).toBe(4);
      expect(readSectionEvent(event({ level: 1 }))?.level).toBe(2);
      expect(readSectionEvent(event({ level: undefined }))?.level).toBe(2);
    });

    it("takes a section without a heading: the opening block has none", () => {
      expect(readSectionEvent(event({ heading: "" }))?.heading).toBe("");
      expect(readSectionEvent(event({ heading: null }))?.heading).toBe("");
    });

    it("puts a heading on one line", () => {
      expect(
        readSectionEvent(event({ heading: " Start with\n the kit " }))?.heading,
      ).toBe("Start with the kit");
    });

    it("is nothing for any other event, a later phase, or a section with no text or place", () => {
      expect(readSectionEvent(null)).toBeNull();
      expect(readSectionEvent("section")).toBeNull();
      expect(readSectionEvent({ type: "token", content: "A" })).toBeNull();
      expect(readSectionEvent(event({ phase: "final" }))).toBeNull();
      expect(readSectionEvent(event({ markdown: "  " }))).toBeNull();
      expect(readSectionEvent(event({ markdown: 7 }))).toBeNull();
      expect(readSectionEvent(event({ index: 0 }))).toBeNull();
      expect(readSectionEvent(event({ index: 1.5 }))).toBeNull();
      expect(readSectionEvent(event({ index: "two" }))).toBeNull();
    });
  });

  describe("withSection", () => {
    it("keeps the article's order whatever the order of arrival", () => {
      const held = [section(3), section(1), section(2)].reduce(
        withSection,
        [] as DraftSection[],
      );
      expect(held.map((one) => one.index)).toEqual([1, 2, 3]);
    });

    it("replaces a section sent again: the writer was asked a second time", () => {
      const held = withSection(
        [section(1), section(2)],
        section(2, { markdown: "Written again." }),
      );
      expect(held).toHaveLength(2);
      expect(held[1].markdown).toBe("Written again.");
    });
  });

  describe("sectionsInOrder", () => {
    it("shows the sections from the first on, as far as they go without a gap", () => {
      expect(sectionsInOrder([section(1), section(2)])).toHaveLength(2);
      expect(
        sectionsInOrder([section(1), section(2), section(4)]).map(
          (one) => one.index,
        ),
      ).toEqual([1, 2]);
    });

    it("holds back a section that arrived before an earlier one", () => {
      expect(sectionsInOrder([section(3)])).toEqual([]);
      expect(
        sectionsInOrder([section(1), section(3)]).map((one) => one.index),
      ).toEqual([1]);
    });

    it("no longer waits for the places given up: the writer left that section out", () => {
      expect(
        sectionsInOrder([section(1), section(3), section(4)], 2).map(
          (one) => one.index,
        ),
      ).toEqual([1, 3, 4]);
      // A later gap is its own wait.
      expect(
        sectionsInOrder([section(1), section(3), section(6)], 2).map(
          (one) => one.index,
        ),
      ).toEqual([1, 3]);
    });
  });

  describe("sectionsMarkdown", () => {
    it("writes each section under its heading, at its level", () => {
      expect(
        sectionsMarkdown([
          section(1, { heading: "", markdown: "The opening." }),
          section(2, { heading: "Kit" }),
          section(3, { heading: "Microphones", level: 3 }),
        ]),
      ).toBe("The opening.\n\n## Kit\n\nText 2.\n\n### Microphones\n\nText 3.");
    });

    it("is empty while nothing may be shown", () => {
      expect(sectionsMarkdown([])).toBe("");
    });
  });
});
