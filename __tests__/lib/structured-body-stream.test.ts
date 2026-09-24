import { extractStructuredBodyPartial } from "@/lib/generate-content/structured-body-stream";

// Field order as the writer streams it: metadata, introduction, a null
// body_markdown, links/schema (schema_data is an escaped JSON string), then
// the section blocks last.
const STREAM = [
  '{"title":"CRM Software for Small Teams","meta_description":"Pick crm software.",',
  '"introduction":"Choosing crm software is easier when you know what you need.",',
  '"body_markdown":null,',
  '"schema_markup":{"schema_type":"Article","schema_data":"{\\"@context\\":\\"https://schema.org\\",\\"headline\\":\\"CRM\\"}"},',
  '"choosing_crm_section":{"heading":"How to Choose CRM Software for a Small Team",',
  '"markdown":"Start with the \\"must-have\\" list.\\n\\n- Fit\\n- Price"},',
  '"cta":null,',
  '"follow_up_section":{"heading":null,"markdown":"Book the demo."}}',
].join("");

const INTRO = "Choosing crm software is easier when you know what you need.";
const FIRST =
  '## How to Choose CRM Software for a Small Team\n\nStart with the "must-have" list.\n\n- Fit\n- Price';

describe("extractStructuredBodyPartial", () => {
  it("assembles introduction + sections from the complete stream", () => {
    expect(extractStructuredBodyPartial(STREAM)).toBe(
      `${INTRO}\n\n${FIRST}\n\nBook the demo.`,
    );
  });

  it("returns nothing before any article text has streamed", () => {
    expect(
      extractStructuredBodyPartial(
        STREAM.slice(0, STREAM.indexOf("introduction")),
      ),
    ).toBe("");
  });

  it("ignores schema_data and the null body_markdown", () => {
    const upToSections = STREAM.slice(
      0,
      STREAM.indexOf('"choosing_crm_section"'),
    );
    expect(extractStructuredBodyPartial(upToSections)).toBe(INTRO);
  });

  it("shows a section heading as soon as it streams, before its prose", () => {
    const cut = STREAM.indexOf('"markdown":"Start');
    expect(extractStructuredBodyPartial(STREAM.slice(0, cut))).toBe(
      `${INTRO}\n\n## How to Choose CRM Software for a Small Team`,
    );
  });

  it("keeps quotes in the prose and handles a value cut mid-escape", () => {
    const cut = STREAM.indexOf("must-have") - 1; // ends on the backslash of \"
    expect(extractStructuredBodyPartial(STREAM.slice(0, cut))).toBe(
      `${INTRO}\n\n## How to Choose CRM Software for a Small Team\n\nStart with the`,
    );
    const after = STREAM.indexOf(" list.");
    expect(extractStructuredBodyPartial(STREAM.slice(0, after))).toContain(
      'Start with the "must-have"',
    );
  });

  it("grows monotonically as tokens arrive", () => {
    let previous = "";
    for (let i = 1; i <= STREAM.length; i++) {
      const current = extractStructuredBodyPartial(STREAM.slice(0, i));
      expect(current.length).toBeGreaterThanOrEqual(previous.trimEnd().length);
      previous = current;
    }
  });
});
