import {
  addRow,
  buildOutlineApproval,
  canRemoveRow,
  moveRow,
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

  it("removes a row and puts it back where it was", () => {
    const { rows: after, removed } = removeRow(rows, "structure.sections:1");
    expect(ids(after)).not.toContain("structure.sections:1");
    expect(removed?.index).toBe(1);
    if (!removed) throw new Error("not removed");
    expect(ids(restoreRow(after, removed.row, removed.index))).toEqual(
      ids(rows),
    );
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
