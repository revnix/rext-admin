import {
  addRow,
  buildOutlineApproval,
  canRemoveRow,
  groupRows,
  moveRow,
  readOnlyBlocks,
  readOutlineGate,
  removeRow,
  renameRow,
  restoreRow,
  rowsEdited,
  rowsFromGate,
  sectionEdits,
  sectionPlan,
  streamedField,
  streamedHeadings,
} from "@/lib/generate-content/outline-review";

// The gate as rext-backend's review_outline sends it (outline_edits.editable_sections).
const gateValue = {
  type: "outline_review",
  editable_sections: [
    {
      id: "structure.sections:0",
      list: "structure.sections",
      heading: "Why it matters",
      heading_level: "H2",
    },
    {
      id: "structure.sections:1",
      list: "structure.sections",
      heading: "Cushioning",
      heading_level: "H2",
    },
    {
      id: "structure.sections:2",
      list: "structure.sections",
      heading: "Heel drop",
      heading_level: "H3",
    },
    {
      id: "structure.sections:3",
      list: "structure.sections",
      heading: "Getting fitted",
      heading_level: "H2",
    },
  ],
  recommended_brand_prominence: "subtle",
  brand_voice_promotion: {
    brand_name: "Acme",
    about: "",
    selling_position: "",
    score: 0.8,
    recommended: true,
  },
  internal_links: [
    { url: "https://acme.test/a", title: "A", score: 0.9, status: "published" },
  ],
};

const outline = {
  structure: {
    sections: [
      {
        heading: "Why it matters",
        description: "What the right shoe changes.",
        suggested_word_count: 300,
        questions_to_answer: ["Does it matter?"],
        key_points: ["Injury", "Comfort"],
      },
    ],
  },
};

const ids = (rows: { id: string | null }[]) => rows.map((row) => row.id);

describe("readOutlineGate", () => {
  it("reads the rows, the recommended level, the promotion and the links", () => {
    const gate = readOutlineGate(gateValue);
    expect(ids(gate.sections)).toEqual([
      "structure.sections:0",
      "structure.sections:1",
      "structure.sections:2",
      "structure.sections:3",
    ]);
    expect(gate.sections[2].heading_level).toBe("H3");
    expect(gate.recommendedProminence).toBe("subtle");
    expect(gate.brandPromotion?.brand_name).toBe("Acme");
    expect(gate.internalLinks).toHaveLength(1);
    expect(gate.addableLists).toEqual([]);
  });

  it("drops malformed rows and tolerates a missing or foreign payload", () => {
    const gate = readOutlineGate({
      editable_sections: [
        { id: "x:0", list: "x", heading: "  " },
        { heading: "No id" },
        null,
      ],
      recommended_brand_prominence: "loud",
    });
    expect(gate.sections).toEqual([]);
    expect(gate.recommendedProminence).toBeNull();
    expect(readOutlineGate(undefined).sections).toEqual([]);
    expect(readOutlineGate("approve").serpResults).toEqual([]);
  });

  it("reads the search evidence when the gate sends it", () => {
    const gate = readOutlineGate({
      serp_titles: [
        {
          position: 1,
          title: "Best shoes",
          domain: "a.test",
          url: "https://a.test/",
        },
        { title: "", url: "https://b.test/" },
      ],
      serp_questions: ["How often?", ""],
      related_searches: ["running shoes"],
      section_additions: ["structure.sections"],
    });
    expect(gate.serpResults).toEqual([
      {
        position: 1,
        title: "Best shoes",
        domain: "a.test",
        url: "https://a.test/",
      },
    ]);
    expect(gate.questions).toEqual(["How often?"]);
    expect(gate.relatedSearches).toEqual(["running shoes"]);
    expect(gate.addableLists).toEqual(["structure.sections"]);
  });

  it("reads the ranking pages' headings, dropping malformed pages and headings (#476)", () => {
    const gate = readOutlineGate({
      competitor_headings: [
        {
          url: "https://a.test/guide",
          title: " A guide ",
          headings: [
            { level: 2, text: "What is it?" },
            { level: 3, text: " Why it matters " },
            { level: 4, text: "Too deep" },
            { level: 2, text: "  " },
          ],
        },
        {
          url: "javascript:alert(1)",
          title: "Bad",
          headings: [{ level: 2, text: "x" }],
        },
        { url: "https://b.test/", title: "No headings", headings: [] },
        "not a page",
      ],
    });
    expect(gate.competitorHeadings).toEqual([
      {
        url: "https://a.test/guide",
        title: "A guide",
        headings: [
          { level: 2, text: "What is it?" },
          { level: 3, text: "Why it matters" },
        ],
      },
    ]);
    expect(readOutlineGate({}).competitorHeadings).toEqual([]);
  });
});

describe("the section edits", () => {
  const rows = rowsFromGate(readOutlineGate(gateValue).sections);

  it("moves a row within its list, and not past either end", () => {
    expect(ids(moveRow(rows, "structure.sections:3", -1))).toEqual([
      "structure.sections:0",
      "structure.sections:1",
      "structure.sections:3",
      "structure.sections:2",
    ]);
    expect(moveRow(rows, "structure.sections:0", -1)).toBe(rows);
    expect(moveRow(rows, "structure.sections:3", 1)).toBe(rows);
  });

  it("keeps each list's rows in their own list", () => {
    const mixed = [
      ...rows,
      { key: "tools:0", id: "tools:0", list: "tools", heading: "A tool" },
      { key: "tools:1", id: "tools:1", list: "tools", heading: "B tool" },
    ];
    const moved = moveRow(mixed, "tools:1", -1);
    expect(ids(moved).slice(4)).toEqual(["tools:1", "tools:0"]);
    expect(ids(moved).slice(0, 4)).toEqual(ids(rows));
  });

  it("renames with the heading trimmed, and ignores a blank one", () => {
    expect(
      renameRow(rows, "structure.sections:1", "  Support  ")[1].heading,
    ).toBe("Support");
    expect(renameRow(rows, "structure.sections:1", "   ")).toBe(rows);
  });

  it("hides a removed row in its place, never sent, and Undo shows it again", () => {
    const { rows: after, removed } = removeRow(rows, "structure.sections:1");
    expect(removed?.key).toBe("structure.sections:1");
    expect(groupRows(after)[0].rows.map((row) => row.key)).not.toContain(
      "structure.sections:1",
    );
    expect(
      sectionEdits(after).map((edit) => ("id" in edit ? edit.id : null)),
    ).not.toContain("structure.sections:1");
    expect(restoreRow(after, "structure.sections:1")).toEqual(rows);
  });

  it("puts rows back where they were after other removals, in any undo order", () => {
    const remove = (current: typeof rows, key: string) =>
      removeRow(current, key).rows;
    const shownIds = (current: typeof rows) =>
      groupRows(current).flatMap((group) => group.rows.map((row) => row.id));
    const [a, b, c] = ids(rows) as string[];
    // Codex's case on #569: remove B, then A; undo B, then A.
    const both = remove(remove(rows, b), a);
    expect(shownIds(restoreRow(both, b))).toEqual(ids(rows).slice(1));
    expect(restoreRow(restoreRow(both, b), a)).toEqual(rows);
    // Remove B, then C; undo B first (the older toast), then C.
    const bc = remove(remove(rows, b), c);
    expect(restoreRow(restoreRow(bc, b), c)).toEqual(rows);
  });

  it("keeps a removed row after the section it followed when others move", () => {
    const [a, b, c, d] = ids(rows) as string[];
    // B goes with its subsection C.
    const removedB = removeRow(rows, b).rows;
    // One Move up takes D past the hidden rows and above A.
    const moved = moveRow(removedB, d, -1);
    expect(groupRows(moved)[0].rows.map((row) => row.id)).toEqual([d, a]);
    expect(restoreRow(moved, b).map((row) => row.id)).toEqual([d, a, b, c]);
  });

  it("puts a row back in its own list after an edit in another", () => {
    const mixed = [
      ...rows,
      { key: "tools:0", id: "tools:0", list: "tools", heading: "A tool" },
      { key: "tools:1", id: "tools:1", list: "tools", heading: "B tool" },
    ];
    const removed = removeRow(mixed, "tools:1").rows;
    const edited = moveRow(
      removeRow(removed, "structure.sections:0").rows,
      "structure.sections:2",
      -1,
    );
    expect(ids(restoreRow(edited, "tools:1")).slice(-2)).toEqual([
      "tools:0",
      "tools:1",
    ]);
  });

  it("removes an H2 with its H3s, and Undo brings the section back whole", () => {
    // "Cushioning" (H2) takes "Heel drop" (H3) with it.
    const {
      rows: after,
      removed,
      subsections,
    } = removeRow(rows, "structure.sections:1");
    expect(removed?.heading).toBe("Cushioning");
    expect(subsections).toBe(1);
    expect(
      sectionEdits(after).map((edit) => ("id" in edit ? edit.id : null)),
    ).toEqual(["structure.sections:0", "structure.sections:3"]);
    expect(restoreRow(after, "structure.sections:1")).toEqual(rows);
  });

  it("removes the first H2 alone when no H3 follows it", () => {
    const { rows: after, subsections } = removeRow(
      rows,
      "structure.sections:0",
    );
    expect(subsections).toBe(0);
    expect(groupRows(after)[0].rows.map((row) => row.id)).toEqual([
      "structure.sections:1",
      "structure.sections:2",
      "structure.sections:3",
    ]);
  });

  it("removes an H3 alone, and an H2's Undo leaves an H3 removed before it removed", () => {
    const h3 = removeRow(rows, "structure.sections:2");
    expect(h3.subsections).toBe(0);
    const h2 = removeRow(h3.rows, "structure.sections:1");
    expect(h2.subsections).toBe(0);
    const undone = restoreRow(h2.rows, "structure.sections:1");
    expect(groupRows(undone)[0].rows.map((row) => row.id)).toEqual([
      "structure.sections:0",
      "structure.sections:1",
      "structure.sections:3",
    ]);
    expect(restoreRow(undone, "structure.sections:2")).toEqual(rows);
  });

  it("keeps the last H2 when removing it would take every row of the list", () => {
    const last = rows.slice(1, 3); // "Cushioning" and its "Heel drop"
    expect(canRemoveRow(last, "structure.sections:1")).toBe(false);
    expect(canRemoveRow(last, "structure.sections:2")).toBe(true);
  });

  it("removes one row from a list without levels", () => {
    const flat = [
      { key: "tools:0", id: "tools:0", list: "tools", heading: "A tool" },
      { key: "tools:1", id: "tools:1", list: "tools", heading: "B tool" },
    ];
    const { rows: after, subsections } = removeRow(flat, "tools:0");
    expect(subsections).toBe(0);
    expect(groupRows(after)[0].rows.map((row) => row.id)).toEqual(["tools:1"]);
  });

  it("never removes a list's last section", () => {
    const one = rows.slice(0, 1);
    expect(canRemoveRow(one, "structure.sections:0")).toBe(false);
    expect(removeRow(one, "structure.sections:0").removed).toBeNull();
  });

  it("adds a section at the end of its list as an H2", () => {
    const added = addRow(rows, "structure.sections", " Caring for them ");
    const last = added[added.length - 1];
    expect(last).toMatchObject({
      id: null,
      list: "structure.sections",
      heading: "Caring for them",
      level: "H2",
    });
  });

  it("knows whether anything changed", () => {
    const offered = readOutlineGate(gateValue).sections;
    expect(rowsEdited(rows, offered)).toBe(false);
    expect(rowsEdited(moveRow(rows, "structure.sections:1", 1), offered)).toBe(
      true,
    );
    expect(
      rowsEdited(renameRow(rows, "structure.sections:0", "New"), offered),
    ).toBe(true);
    expect(
      rowsEdited(removeRow(rows, "structure.sections:0").rows, offered),
    ).toBe(true);
  });

  it("sends each row with its id and heading, and an added one as new", () => {
    const edits = sectionEdits(
      addRow(
        moveRow(rows, "structure.sections:3", -1),
        "structure.sections",
        "Care",
      ),
    );
    expect(edits[2]).toEqual({
      id: "structure.sections:3",
      heading: "Getting fitted",
      heading_level: "H2",
    });
    expect(edits[3]).toEqual({
      id: "structure.sections:2",
      heading: "Heel drop",
      heading_level: "H3",
    });
    expect(edits[4]).toEqual({
      new: true,
      list: "structure.sections",
      heading: "Care",
      heading_level: "H2",
    });
  });
});

describe("buildOutlineApproval", () => {
  const gate = readOutlineGate(gateValue);
  const rows = rowsFromGate(gate.sections);
  const base = {
    tone: "Friendly",
    targetAudience: ["Beginners"],
    targetWordCount: 1800,
    gate,
    selectedLinks: gate.internalLinks,
    prominence: "subtle" as const,
    personaId: null,
    rows,
  };

  it("sends the brief, the level and no sections when nothing moved", () => {
    expect(buildOutlineApproval(base)).toEqual({
      tone: "Friendly",
      target_audience: ["Beginners"],
      target_word_count: 1800,
      selected_internal_links: gate.internalLinks,
      brand_prominence: "subtle",
      selected_persona_id: null,
    });
  });

  it("sends the sections in the user's order once they changed", () => {
    const twiceUp = moveRow(
      moveRow(rows, "structure.sections:3", -1),
      "structure.sections:3",
      -1,
    );
    const approval = buildOutlineApproval({ ...base, rows: twiceUp });
    expect(
      approval.sections?.map((edit) => ("id" in edit ? edit.id : null)),
    ).toEqual([
      "structure.sections:0",
      "structure.sections:3",
      "structure.sections:1",
      "structure.sections:2",
    ]);
  });

  it("sends promote_brand to a backend that names no level", () => {
    const older = readOutlineGate({
      ...gateValue,
      recommended_brand_prominence: undefined,
    });
    const approval = buildOutlineApproval({
      ...base,
      gate: older,
      prominence: "none",
    });
    expect(approval.promote_brand).toBe(false);
    expect(approval).not.toHaveProperty("brand_prominence");
  });

  it("sends nothing about links or the brand when the gate offers neither", () => {
    const bare = readOutlineGate({
      editable_sections: gateValue.editable_sections,
    });
    const approval = buildOutlineApproval({
      ...base,
      gate: bare,
      selectedLinks: [],
    });
    expect(approval).not.toHaveProperty("selected_internal_links");
    expect(approval).not.toHaveProperty("brand_prominence");
    expect(approval).not.toHaveProperty("promote_brand");
    expect(approval.selected_persona_id).toBeNull();
  });
});

describe("reading the outline", () => {
  it("shows an outline without editable rows read-only, from _render or its sections", () => {
    const blocks = [{ heading: "Body", items: [{ label: "One", points: [] }] }];
    expect(readOnlyBlocks({ _render: { blocks } })).toEqual(blocks);
    expect(
      readOnlyBlocks({
        sections: [
          { heading: " Why it matters ", key_points: ["A point", ""] },
          { heading: "" },
          "not a section",
        ],
      }),
    ).toEqual([
      {
        heading: "Sections",
        items: [{ label: "Why it matters", points: ["A point"] }],
      },
    ]);
    expect(readOnlyBlocks({ _render: { blocks: [] }, sections: [] })).toEqual(
      [],
    );
    expect(readOnlyBlocks(null)).toEqual([]);
  });

  it("finds a row's plan in the outline by its id", () => {
    expect(sectionPlan(outline, "structure.sections:0")).toEqual({
      description: "What the right shoe changes.",
      wordCount: 300,
      questions: ["Does it matter?"],
      keyPoints: ["Injury", "Comfort"],
    });
    expect(sectionPlan(outline, "structure.sections:7")).toBeNull();
    expect(sectionPlan(outline, null)).toBeNull();
    expect(sectionPlan(outline, "nonsense")).toBeNull();
  });

  it("reads the headings and fields of an outline still streaming", () => {
    const raw =
      '{"title":"Running shoes","brief":"How to ch' +
      '","structure":{"sections":[{"heading":"Why it \\"matters\\"","key_points":[]},{"heading":"Cush';
    expect(streamedHeadings(raw)).toEqual(['Why it "matters"']);
    expect(streamedField(raw, "title")).toBe("Running shoes");
    expect(streamedField('{"title":"Runn', "title")).toBe("Runn");
    expect(streamedField("{", "title")).toBe("");
  });
});
