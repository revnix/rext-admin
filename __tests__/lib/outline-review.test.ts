import {
  addedSections,
  addRow,
  addSubsection,
  blockEnd,
  blocksShowFaqs,
  buildOutlineApproval,
  canAddSection,
  canChangeLevel,
  canRemoveRow,
  canRestoreRow,
  changeLevel,
  dropGaps,
  groupRows,
  insertAnnouncement,
  insertLevelAt,
  insertRow,
  levelAnnouncement,
  listSummary,
  MAX_ADDED_SECTIONS,
  moveAnnouncement,
  moveBlockTo,
  moveRow,
  moveTarget,
  nearestGap,
  placeBelow,
  readOnlyBlocks,
  readOutlineFaqs,
  readOutlineGate,
  removalAnnouncement,
  removeRow,
  renameRow,
  restoreAnnouncement,
  restoreRow,
  rowPlace,
  rowsEdited,
  rowsFromGate,
  sectionEdits,
  sectionPlan,
  siblingPlace,
  streamedField,
  streamedHeadings,
  type TreeRow,
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

  it("moves a section past the whole section beside it, and not past either end", () => {
    // "Getting fitted" goes above "Cushioning" and its "Heel drop", never between them.
    expect(ids(moveRow(rows, "structure.sections:3", -1))).toEqual([
      "structure.sections:0",
      "structure.sections:3",
      "structure.sections:1",
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
    expect(edits[1]).toEqual({
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

// A blog outline with subsections (FB2.15): Why plan · Choosing the spot (Sun hours, Soil) ·
// Planning beds (Bed sizes) · Timing.
const deepGate = {
  editable_sections: (
    [
      ["Why plan", "H2"],
      ["Choosing the spot", "H2"],
      ["Sun hours", "H3"],
      ["Soil", "H3"],
      ["Planning beds", "H2"],
      ["Bed sizes", "H3"],
      ["Timing", "H2"],
    ] as const
  ).map(([heading, heading_level], index) => ({
    id: `s:${index}`,
    list: "s",
    heading,
    heading_level,
  })),
};
const deepOutline = {
  s: [200, 300, 150, 200, 350, 150, 400].map((words) => ({
    heading: "",
    suggested_word_count: words,
  })),
};

const treeRow = (
  key: string,
  heading: string,
  level?: "H2" | "H3" | "H4",
  list = "s",
): TreeRow => ({ key, id: key, list, heading, ...(level ? { level } : {}) });
const shownHeadings = (rows: TreeRow[]) =>
  groupRows(rows).flatMap((group) => group.rows.map((item) => item.heading));
const keyOf = (rows: TreeRow[], heading: string) =>
  rows.find((item) => item.heading === heading)?.key ?? "";

describe("moving a section with its subsections", () => {
  const rows = rowsFromGate(readOutlineGate(deepGate).sections);

  it("takes an H2 and its H3s past the whole section above", () => {
    const moved = moveRow(rows, "s:4", -1);
    expect(shownHeadings(moved)).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Timing",
    ]);
    expect(moveAnnouncement(rows, moved, "s:4")).toBe(
      "Moved Planning beds and its subsection to position 2 of 7, after Why plan.",
    );
  });

  it("takes an H2 and its H3s past the whole section below", () => {
    expect(shownHeadings(moveRow(rows, "s:1", 1))).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Timing",
    ]);
  });

  it("keeps the first row first and the last row last", () => {
    expect(moveRow(rows, "s:0", -1)).toBe(rows);
    expect(moveRow(rows, "s:6", 1)).toBe(rows);
    expect(moveTarget(rows, 0, -1)).toBeNull();
    expect(moveTarget(rows, 6, 1)).toBeNull();
  });

  it("says a section is at the top once it is", () => {
    const moved = moveRow(rows, "s:1", -1);
    expect(shownHeadings(moved)[0]).toBe("Choosing the spot");
    expect(moveAnnouncement(rows, moved, "s:1")).toBe(
      "Moved Choosing the spot and its 2 subsections to position 1 of 7, at the top.",
    );
  });

  it("moves a subsection among the subsections of its section", () => {
    const up = moveRow(rows, "s:3", -1);
    expect(shownHeadings(up).slice(1, 4)).toEqual([
      "Choosing the spot",
      "Soil",
      "Sun hours",
    ]);
    expect(moveAnnouncement(rows, up, "s:3")).toBe(
      "Moved Soil to position 3 of 7, after Choosing the spot.",
    );
    expect(shownHeadings(moveRow(rows, "s:2", 1))).toEqual(shownHeadings(up));
  });

  it("takes a first subsection up to the end of the section before, and says so", () => {
    const moved = moveRow(rows, "s:5", -1);
    expect(shownHeadings(moved)).toEqual([
      "Why plan",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Bed sizes",
      "Planning beds",
      "Timing",
    ]);
    expect(moveAnnouncement(rows, moved, "s:5")).toBe(
      "Moved Bed sizes to position 5 of 7, now a subsection of Choosing the spot.",
    );
  });

  it("takes a last subsection down to the start of the next section, and says so", () => {
    const moved = moveRow(rows, "s:3", 1);
    expect(shownHeadings(moved)).toEqual([
      "Why plan",
      "Choosing the spot",
      "Sun hours",
      "Planning beds",
      "Soil",
      "Bed sizes",
      "Timing",
    ]);
    expect(moveAnnouncement(rows, moved, "s:3")).toBe(
      "Moved Soil to position 5 of 7, now a subsection of Planning beds.",
    );
  });

  it("never lets a subsection open the list, nor fall off its end", () => {
    const short = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("b", "B", "H2"),
    ];
    // Above "A" there is no section to join: the first section is never a subsection.
    expect(moveRow(short, "a1", -1)).toBe(short);
    expect(shownHeadings(moveRow(short, "a1", 1))).toEqual(["A", "B", "A one"]);
    const last = [treeRow("a", "A", "H2"), treeRow("a1", "A one", "H3")];
    expect(moveRow(last, "a1", 1)).toBe(last);
  });

  it("moves an H3 with its H4s, and an H2 with both", () => {
    const pillar = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a11", "A one, deeper", "H4"),
      treeRow("a2", "A two", "H3"),
      treeRow("b", "B", "H2"),
    ];
    expect(blockEnd(pillar, 0)).toBe(4);
    expect(blockEnd(pillar, 1)).toBe(3);
    expect(shownHeadings(moveRow(pillar, "a1", 1))).toEqual([
      "A",
      "A two",
      "A one",
      "A one, deeper",
      "B",
    ]);
    expect(shownHeadings(moveRow(pillar, "b", -1))).toEqual([
      "B",
      "A",
      "A one",
      "A one, deeper",
      "A two",
    ]);
  });

  it("moves one row at a time in a list without levels", () => {
    const flat = [
      treeRow("t0", "Trowel"),
      treeRow("t1", "Fork"),
      treeRow("t2", "Hose"),
    ];
    expect(shownHeadings(moveRow(flat, "t2", -1))).toEqual([
      "Trowel",
      "Hose",
      "Fork",
    ]);
    expect(moveRow(flat, "t0", -1)).toBe(flat);
  });

  it("puts a removed section back after the section it followed, after a move", () => {
    // "Planning beds" goes with "Bed sizes"; then "Choosing the spot" moves below "Timing".
    const removed = removeRow(rows, "s:4").rows;
    const moved = moveRow(removed, "s:1", 1);
    expect(shownHeadings(moved)).toEqual([
      "Why plan",
      "Timing",
      "Choosing the spot",
      "Sun hours",
      "Soil",
    ]);
    expect(shownHeadings(restoreRow(moved, "s:4"))).toEqual([
      "Why plan",
      "Timing",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Planning beds",
      "Bed sizes",
    ]);
  });

  it("undoes a move with the opposite move", () => {
    expect(moveRow(moveRow(rows, "s:4", -1), "s:4", 1)).toEqual(rows);
    expect(moveRow(moveRow(rows, "s:5", -1), "s:5", 1)).toEqual(rows);
  });
});

describe("dropping a dragged section", () => {
  const rows = rowsFromGate(readOutlineGate(deepGate).sections);

  it("offers an H2 only the gaps between whole sections", () => {
    // "Choosing the spot" (rows 1 to 3): the top, its own place, before "Timing" and the end.
    expect(dropGaps(rows, 1)).toEqual([0, 1, 4, 6, 7]);
  });

  it("offers a subsection every gap but the top", () => {
    expect(dropGaps(rows, 2)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps an H3 from landing between another H3 and its H4s", () => {
    const pillar = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a11", "A one, deeper", "H4"),
      treeRow("a2", "A two", "H3"),
    ];
    expect(dropGaps(pillar, 3)).toEqual([1, 3, 4]);
  });

  it("picks the gap nearest the pointer among those offered", () => {
    const tops = [0, 40, 80, 120, 160];
    expect(nearestGap(tops, [0, 3, 4], 50)).toBe(0);
    expect(nearestGap(tops, [0, 3, 4], 70)).toBe(3);
    expect(nearestGap(tops, [0, 3, 4], 500)).toBe(4);
    expect(nearestGap(tops, [], 50)).toBeNull();
  });

  it("drops a section with its subsections where the line showed", () => {
    expect(shownHeadings(moveBlockTo(rows, "s:1", 7))).toEqual([
      "Why plan",
      "Planning beds",
      "Bed sizes",
      "Timing",
      "Choosing the spot",
      "Sun hours",
      "Soil",
    ]);
    expect(shownHeadings(moveBlockTo(rows, "s:6", 1))).toEqual([
      "Why plan",
      "Timing",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Planning beds",
      "Bed sizes",
    ]);
  });

  it("drops a subsection into another section", () => {
    const moved = moveBlockTo(rows, "s:2", 6);
    expect(shownHeadings(moved).slice(3)).toEqual([
      "Planning beds",
      "Bed sizes",
      "Sun hours",
      "Timing",
    ]);
    expect(rowPlace(moved, "s:2")?.parent?.heading).toBe("Planning beds");
  });

  it("leaves the rows as they are for its own place or a gap it can't take", () => {
    expect(moveBlockTo(rows, "s:1", 1)).toBe(rows);
    expect(moveBlockTo(rows, "s:1", 4)).toBe(rows);
    // An H2 into the middle of a section, and a subsection to the top.
    expect(moveBlockTo(rows, "s:1", 5)).toBe(rows);
    expect(moveBlockTo(rows, "s:2", 0)).toBe(rows);
    expect(moveBlockTo(rows, "s:9", 0)).toBe(rows);
  });
});

describe("changing a section's level", () => {
  const offered = readOutlineGate(deepGate).sections;
  const rows = rowsFromGate(offered);

  it("makes a section a subsection of the section above, in place", () => {
    const changed = changeLevel(rows, "s:4", "H3");
    expect(shownHeadings(changed)).toEqual(shownHeadings(rows));
    expect(changed[4].level).toBe("H3");
    // Its own subsection now sits beside it under "Choosing the spot".
    expect(rowPlace(changed, "s:5")?.parent?.heading).toBe("Choosing the spot");
    expect(levelAnnouncement(changed, "s:4")).toBe(
      "Planning beds is now a subsection of Choosing the spot.",
    );
  });

  it("never makes the first section a subsection", () => {
    expect(canChangeLevel(rows, "s:0", "H3")).toBe(false);
    expect(changeLevel(rows, "s:0", "H3")).toBe(rows);
  });

  it("makes a subsection a section, which takes the subsections after it", () => {
    const changed = changeLevel(rows, "s:2", "H2");
    expect(changed[2].level).toBe("H2");
    expect(rowPlace(changed, "s:3")?.parent?.heading).toBe("Sun hours");
    expect(levelAnnouncement(changed, "s:2")).toBe(
      "Sun hours is now a section, with its subsection.",
    );
    expect(levelAnnouncement(changeLevel(rows, "s:3", "H2"), "s:3")).toBe(
      "Soil is now a section.",
    );
  });

  it("changes nothing for the level a row has, an H4, or a list without levels", () => {
    expect(changeLevel(rows, "s:1", "H2")).toBe(rows);
    expect(changeLevel(rows, "s:2", "H3")).toBe(rows);
    const pillar = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a11", "A one, deeper", "H4"),
    ];
    expect(canChangeLevel(pillar, "a11", "H3")).toBe(false);
    expect(canChangeLevel(pillar, "a11", "H2")).toBe(false);
    const flat = [treeRow("t0", "Trowel"), treeRow("t1", "Fork")];
    expect(canChangeLevel(flat, "t1", "H3")).toBe(false);
  });

  it("counts a level change alone as an edit, until it is changed back", () => {
    expect(rowsEdited(rows, offered)).toBe(false);
    const changed = changeLevel(rows, "s:4", "H3");
    expect(rowsEdited(changed, offered)).toBe(true);
    expect(sectionEdits(changed)[4]).toEqual({
      id: "s:4",
      heading: "Planning beds",
      heading_level: "H3",
    });
    expect(rowsEdited(changeLevel(changed, "s:4", "H2"), offered)).toBe(false);
  });

  it("reads an H4 from the gate and sends it back as it came", () => {
    const gate = readOutlineGate({
      editable_sections: [
        { id: "s:0", list: "s", heading: "A", heading_level: "H2" },
        { id: "s:1", list: "s", heading: "A one", heading_level: "H3" },
        { id: "s:2", list: "s", heading: "Deeper", heading_level: "H4" },
        { id: "s:3", list: "s", heading: "Odd", heading_level: "H5" },
      ],
    });
    expect(gate.sections[2].heading_level).toBe("H4");
    expect(gate.sections[3].heading_level).toBeUndefined();
    expect(sectionEdits(rowsFromGate(gate.sections))[2]).toEqual({
      id: "s:2",
      heading: "Deeper",
      heading_level: "H4",
    });
  });

  it("removes an H3 with its H4s, and an H2 with every row under it", () => {
    const pillar = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a11", "A one, deeper", "H4"),
      treeRow("a2", "A two", "H3"),
      treeRow("b", "B", "H2"),
    ];
    const h3 = removeRow(pillar, "a1");
    expect(h3.subsections).toBe(1);
    expect(shownHeadings(h3.rows)).toEqual(["A", "A two", "B"]);
    expect(restoreRow(h3.rows, "a1")).toEqual(pillar);
    const h2 = removeRow(pillar, "a");
    expect(h2.subsections).toBe(3);
    expect(shownHeadings(h2.rows)).toEqual(["B"]);
  });
});

describe("adding a section in place", () => {
  const rows = rowsFromGate(readOutlineGate(deepGate).sections);

  it("puts a section where it was asked for: the top, between two, the end", () => {
    expect(
      shownHeadings(insertRow(rows, "s", 0, " Before you start "))[0],
    ).toBe("Before you start");
    const between = insertRow(rows, "s", 4, "Tools");
    expect(shownHeadings(between).slice(3, 6)).toEqual([
      "Soil",
      "Tools",
      "Planning beds",
    ]);
    expect(between[4]).toMatchObject({ id: null, list: "s", level: "H2" });
    expect(insertAnnouncement(between, "s", 4)).toBe(
      "Added Tools as a section, position 5 of 8.",
    );
    expect(shownHeadings(insertRow(rows, "s", 7, "Checklist")).at(-1)).toBe(
      "Checklist",
    );
  });

  it("puts a subsection where it was asked for, sent as a new H3", () => {
    const added = insertRow(rows, "s", 3, "Wind", "H3");
    expect(shownHeadings(added).slice(1, 5)).toEqual([
      "Choosing the spot",
      "Sun hours",
      "Wind",
      "Soil",
    ]);
    expect(sectionEdits(added)[3]).toEqual({
      new: true,
      list: "s",
      heading: "Wind",
      heading_level: "H3",
    });
    expect(insertAnnouncement(added, "s", 3)).toBe(
      "Added Wind as a subsection of Choosing the spot, position 4 of 8.",
    );
  });

  it("refuses a blank heading, a place outside the list, and a subsection at the top", () => {
    expect(insertRow(rows, "s", 2, "   ")).toBe(rows);
    expect(insertRow(rows, "s", 9, "Too far")).toBe(rows);
    expect(insertRow(rows, "s", -1, "Too far")).toBe(rows);
    expect(insertRow(rows, "other", 0, "No such list")).toBe(rows);
    expect(insertRow(rows, "s", 0, "Opening", "H3")).toBe(rows);
  });

  it("gives a row of a list without levels no level", () => {
    const flat = [treeRow("t0", "Trowel"), treeRow("t1", "Fork")];
    const added = insertRow(flat, "s", 1, "Hose", "H3");
    expect(shownHeadings(added)).toEqual(["Trowel", "Hose", "Fork"]);
    expect(added[1]).not.toHaveProperty("level");
    expect(insertAnnouncement(added, "s", 1)).toBe(
      "Added Hose, position 2 of 3.",
    );
  });

  it("stops at six new sections, counted across the lists", () => {
    let current: TreeRow[] = [
      ...rows,
      treeRow("t0", "Trowel", undefined, "tools"),
    ];
    for (let count = 1; count <= MAX_ADDED_SECTIONS; count += 1) {
      expect(canAddSection(current)).toBe(true);
      current =
        count % 2 === 0
          ? insertRow(current, "tools", 1, `Tool ${count}`)
          : addRow(current, "s", `Section ${count}`);
      expect(addedSections(current)).toBe(count);
    }
    expect(MAX_ADDED_SECTIONS).toBe(6);
    expect(canAddSection(current)).toBe(false);
    expect(insertRow(current, "s", 0, "A seventh")).toBe(current);
    expect(addRow(current, "s", "A seventh")).toBe(current);
    expect(addSubsection(current, "s:1", "A seventh")).toBe(current);
    expect(sectionEdits(current).filter((edit) => "new" in edit)).toHaveLength(
      6,
    );
  });

  it("frees a place when an added section is removed, and holds an Undo that would pass six", () => {
    let current = rows;
    for (let count = 1; count <= MAX_ADDED_SECTIONS; count += 1)
      current = addRow(current, "s", `Section ${count}`);
    const first = keyOf(current, "Section 1");
    const removed = removeRow(current, first).rows;
    expect(canAddSection(removed)).toBe(true);
    expect(canRestoreRow(removed, first)).toBe(true);
    const refilled = addRow(removed, "s", "Section 7");
    expect(addedSections(refilled)).toBe(6);
    expect(canRestoreRow(refilled, first)).toBe(false);
    // A removed section the gate offered always comes back.
    expect(canRestoreRow(removeRow(refilled, "s:6").rows, "s:6")).toBe(true);
  });

  it("keeps a new subsection in its section when the removed section after it comes back", () => {
    const removed = removeRow(rows, "s:4").rows;
    const added = addSubsection(removed, "s:1", "Wind");
    expect(shownHeadings(restoreRow(added, "s:4"))).toEqual([
      "Why plan",
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Wind",
      "Planning beds",
      "Bed sizes",
      "Timing",
    ]);
  });

  it("keeps a removed subsection in its section when a new section goes in after it", () => {
    const removed = removeRow(rows, "s:3").rows;
    const added = insertRow(removed, "s", 3, "Tools");
    expect(shownHeadings(restoreRow(added, "s:3")).slice(1, 6)).toEqual([
      "Choosing the spot",
      "Sun hours",
      "Soil",
      "Tools",
      "Planning beds",
    ]);
  });

  it("adds a subsection at the end of an H2's subsections, and under no other row", () => {
    expect(
      shownHeadings(addSubsection(rows, "s:1", "Wind")).slice(1, 5),
    ).toEqual(["Choosing the spot", "Sun hours", "Soil", "Wind"]);
    expect(addSubsection(rows, "s:2", "Under an H3")).toBe(rows);
    expect(addSubsection(rows, "s:1", "  ")).toBe(rows);
  });
});

describe("what the outline says about itself", () => {
  const rows = rowsFromGate(readOutlineGate(deepGate).sections);

  it("gives a row's place, the row before it, its section and what is under it", () => {
    expect(rowPlace(rows, "s:3")).toEqual({
      position: 4,
      total: 7,
      previous: rows[2],
      parent: rows[1],
      subsections: 0,
    });
    expect(rowPlace(rows, "s:1")).toMatchObject({
      position: 2,
      parent: null,
      subsections: 2,
    });
    expect(rowPlace(rows, "s:0")?.previous).toBeNull();
    expect(rowPlace(rows, "nope")).toBeNull();
    expect(rowPlace(removeRow(rows, "s:6").rows, "s:6")).toBeNull();
  });

  it("words a removal and its Undo, with the subsections that went along", () => {
    expect(removalAnnouncement("Timing", 2)).toBe(
      "Removed Timing and its 2 subsections. Undo is in the notification.",
    );
    expect(removalAnnouncement("Soil", 0)).toBe(
      "Removed Soil. Undo is in the notification.",
    );
    expect(restoreAnnouncement("Planning beds", 1)).toBe(
      "Restored Planning beds and its subsection.",
    );
  });

  it("sums a list up: sections, subsections and the words budgeted", () => {
    expect(listSummary(rows, deepOutline, "s")).toBe(
      "4 sections · 3 subsections · ~1,750 words",
    );
    // A removal takes its budget away; an added section counts the middle budget, as the backend gives it.
    expect(listSummary(removeRow(rows, "s:4").rows, deepOutline, "s")).toBe(
      "3 sections · 2 subsections · ~1,250 words",
    );
    expect(listSummary(addRow(rows, "s", "Tools"), deepOutline, "s")).toBe(
      "5 sections · 3 subsections · ~1,950 words",
    );
    // One section left, with no budget to add up.
    expect(listSummary([treeRow("a", "A", "H2")], {}, "s")).toBe("1 section");
  });

  it("counts a list without heading levels by its own name", () => {
    // A How-to's lists, as a real run sent them: "Steps" and "Tools", neither with levels.
    const named = (list: string, count: number) =>
      Array.from({ length: count }, (_, index) =>
        treeRow(`${list}:${index}`, `Row ${index}`, undefined, list),
      );
    const summary = (list: string, count: number) =>
      listSummary(named(list, count), {}, list);

    expect(summary("steps", 5)).toBe("5 steps");
    expect(summary("steps", 1)).toBe("1 step");
    expect(summary("tools", 3)).toBe("3 tools");
    expect(summary("tools", 1)).toBe("1 tool");
    // The name is the list's label: the last part of its path, underscores as spaces.
    expect(summary("structure.key_decisions", 2)).toBe("2 key decisions");
    expect(summary("structure.key_decisions", 1)).toBe("1 key decision");
    expect(summary("phases", 1)).toBe("1 phase");
    // No simple singular: items, for one row and for many, so the word never changes with the count.
    for (const list of [
      "categories",
      "classes",
      "boxes",
      "analysis",
      "tools_needed",
      "glossary",
    ]) {
      expect(summary(list, 1)).toBe("1 item");
      expect(summary(list, 4)).toBe("4 items");
    }
  });

  it("keeps the words budgeted beside a named count, and sections where rows have levels", () => {
    const steps = [0, 1, 2].map((index) =>
      treeRow(`steps:${index}`, `Step ${index}`, undefined, "steps"),
    );
    const budgets = {
      steps: [300, 250, 350].map((words) => ({
        suggested_word_count: words,
      })),
    };
    expect(listSummary(steps, budgets, "steps")).toBe("3 steps · ~900 words");
    expect(
      listSummary(removeRow(steps, "steps:1").rows, budgets, "steps"),
    ).toBe("2 steps · ~650 words");
    // A list named for something else still counts sections once its rows carry levels.
    const levelled = [
      treeRow("steps:0", "Prepare", "H2", "steps"),
      treeRow("steps:1", "Measure", "H3", "steps"),
    ];
    expect(listSummary(levelled, {}, "steps")).toBe("1 section · 1 subsection");
  });

  it("reads the FAQ's questions from every shape the outline holds them in", () => {
    expect(readOutlineFaqs({ faqs: [" When to start? ", "", 3] })).toEqual([
      "When to start?",
    ]);
    expect(
      readOutlineFaqs({
        faqs: [
          { question: "How big?", answer: "Small." },
          { answer: "No question" },
        ],
      }),
    ).toEqual(["How big?"]);
    expect(
      readOutlineFaqs({ faq: { faqs: [{ question: "How much sun?" }] } }),
    ).toEqual(["How much sun?"]);
    // An empty `faqs` falls through to `faq`.
    expect(readOutlineFaqs({ faqs: [], faq: ["Which layout?"] })).toEqual([
      "Which layout?",
    ]);
    expect(readOutlineFaqs({ faq: [{ label: "Docs", url: "/docs" }] })).toEqual(
      [],
    );
    expect(readOutlineFaqs({ sections: [] })).toEqual([]);
    expect(readOutlineFaqs(null)).toEqual([]);
  });
});

// A pillar outline: A (A one (Deeper one, Deeper two), A two) · B.
const pillarRows = [
  treeRow("a", "A", "H2"),
  treeRow("a1", "A one", "H3"),
  treeRow("a11", "Deeper one", "H4"),
  treeRow("a12", "Deeper two", "H4"),
  treeRow("a2", "A two", "H3"),
  treeRow("b", "B", "H2"),
];

describe("a subsection with H4s under it", () => {
  it("puts a row added below it after its H4s, which stay its own", () => {
    expect(placeBelow(pillarRows, 1)).toEqual({ gap: 4, level: "H3" });
    const added = insertRow(pillarRows, "s", 4, "A one and a half", "H3");
    expect(shownHeadings(added)).toEqual([
      "A",
      "A one",
      "Deeper one",
      "Deeper two",
      "A one and a half",
      "A two",
      "B",
    ]);
    expect(rowPlace(added, "a11")?.parent?.heading).toBe("A one");
    expect(rowPlace(added, "a12")?.parent?.heading).toBe("A one");
    expect(insertAnnouncement(added, "s", 4)).toBe(
      "Added A one and a half as a subsection of A, position 5 of 7.",
    );
  });

  it("puts a section added below an H2 after everything under it, and nothing beside an H4", () => {
    expect(placeBelow(pillarRows, 0)).toEqual({ gap: 5, level: "H2" });
    expect(placeBelow(pillarRows, 4)).toEqual({ gap: 5, level: "H3" });
    expect(placeBelow(pillarRows, 5)).toEqual({ gap: 6, level: "H2" });
    expect(placeBelow(pillarRows, 2)).toBeNull();
    const flat = [treeRow("t0", "Trowel"), treeRow("t1", "Fork")];
    expect(placeBelow(flat, 0)).toEqual({ gap: 1, level: "H2" });
  });

  it("offers a new row no place above an H4", () => {
    // Above a section a section, above a subsection a subsection, at the end a section...
    expect(
      [0, 1, 4, 5, 6].map((gap) => insertLevelAt(pillarRows, gap)),
    ).toEqual(["H2", "H3", "H3", "H2", "H2"]);
    // ...and above an H4 nothing: a new H3 there would take the H4s after it from "A one".
    expect(insertLevelAt(pillarRows, 2)).toBeNull();
    expect(insertLevelAt(pillarRows, 3)).toBeNull();
  });

  it("refuses a row that would come between a row and what is under it", () => {
    expect(insertRow(pillarRows, "s", 2, "Between", "H3")).toBe(pillarRows);
    expect(insertRow(pillarRows, "s", 3, "Between", "H3")).toBe(pillarRows);
    // A new H2 above an H3 would take that H3, and the rest of the section, from "A".
    expect(insertRow(pillarRows, "s", 1, "Between")).toBe(pillarRows);
    expect(insertRow(pillarRows, "s", 4, "Between")).toBe(pillarRows);
  });

  it("adds a subsection to the H2 after its last subsection's H4s", () => {
    const deep = pillarRows.filter((item) => item.key !== "a2");
    expect(shownHeadings(addSubsection(deep, "a", "A two"))).toEqual([
      "A",
      "A one",
      "Deeper one",
      "Deeper two",
      "A two",
      "B",
    ]);
  });
});

describe("a row's place among its siblings", () => {
  const rows = rowsFromGate(readOutlineGate(deepGate).sections);
  const places = (list: TreeRow[]) =>
    list.map((_, index) => {
      const { position, size } = siblingPlace(list, index);
      return `${position}/${size}`;
    });

  it("counts a section among the sections, a subsection among those of its section", () => {
    // Why plan · Choosing the spot (Sun hours, Soil) · Planning beds (Bed sizes) · Timing.
    expect(places(rows)).toEqual([
      "1/4",
      "2/4",
      "1/2",
      "2/2",
      "3/4",
      "1/1",
      "4/4",
    ]);
    // The live region's position stays the row's place in the whole list.
    expect(rowPlace(rows, "s:3")).toMatchObject({ position: 4, total: 7 });
  });

  it("counts an H4 among the H4s of its subsection", () => {
    expect(places(pillarRows)).toEqual([
      "1/2",
      "1/2",
      "1/2",
      "2/2",
      "2/2",
      "2/2",
    ]);
  });

  it("counts every row of a list without levels", () => {
    const flat = [
      treeRow("t0", "Trowel"),
      treeRow("t1", "Fork"),
      treeRow("t2", "Hose"),
    ];
    expect(places(flat)).toEqual(["1/3", "2/3", "3/3"]);
  });

  it("follows a move and a change of level", () => {
    // "Bed sizes" joins "Choosing the spot" as its third subsection.
    const moved = moveRow(rows, "s:5", -1);
    expect(siblingPlace(groupRows(moved)[0].rows, 4)).toEqual({
      position: 3,
      size: 3,
    });
    // "Sun hours" becomes a section: five sections, and "Soil" is its only subsection.
    const changed = changeLevel(rows, "s:2", "H2");
    expect(places(changed).slice(1, 4)).toEqual(["2/5", "3/5", "1/1"]);
  });
});

describe("read-only blocks that already show the FAQ", () => {
  const questions = ["When to start?", "How big?"];
  const steps = { heading: "Steps", items: [{ label: "Dig", points: [] }] };
  const block = (heading: string, labels: string[]) => ({
    heading,
    items: labels.map((label) => ({ label, points: [] })),
  });

  it("knows the backend's block for the outline's faqs by its heading", () => {
    // `_render.blocks` labels the outline's `faqs` "Faqs" and its `faq` "Faq".
    for (const heading of ["Faqs", "Faq", "FAQ", "Product FAQs"])
      expect(
        blocksShowFaqs([steps, block(heading, questions)], questions),
      ).toBe(true);
    expect(
      blocksShowFaqs([block("Frequently asked questions", [])], questions),
    ).toBe(true);
  });

  it("knows a block that lists every question, whatever it is headed", () => {
    expect(
      blocksShowFaqs(
        [steps, block("Questions", [" when to START? ", "How big?", "More"])],
        questions,
      ),
    ).toBe(true);
    // One question that is also a section's heading is not the FAQ.
    expect(
      blocksShowFaqs([block("Sections", ["When to start?"])], questions),
    ).toBe(false);
  });

  it("finds no FAQ in blocks that hold none", () => {
    expect(blocksShowFaqs([steps], questions)).toBe(false);
    expect(blocksShowFaqs([block("Facts", ["Sun"])], questions)).toBe(false);
    expect(blocksShowFaqs([steps], [])).toBe(false);
    expect(blocksShowFaqs([], questions)).toBe(false);
  });
});

// A pillar outline with H4s in two sections:
// Soil (Soil types (Clay, Sand), Drainage (Gravel), Mulch) · Watering (Hoses (Drip)).
const deepRows = [
  treeRow("soil", "Soil", "H2"),
  treeRow("types", "Soil types", "H3"),
  treeRow("clay", "Clay", "H4"),
  treeRow("sand", "Sand", "H4"),
  treeRow("drain", "Drainage", "H3"),
  treeRow("gravel", "Gravel", "H4"),
  treeRow("mulch", "Mulch", "H3"),
  treeRow("water", "Watering", "H2"),
  treeRow("hoses", "Hoses", "H3"),
  treeRow("drip", "Drip", "H4"),
];
/** The H4s with no H3 or H4 before them: straight under an H2, or opening the list. */
const strayH4s = (rows: TreeRow[]) => {
  const list = groupRows(rows).flatMap((group) => group.rows);
  return list
    .filter(
      (item, index) =>
        item.level === "H4" &&
        list[index - 1]?.level !== "H3" &&
        list[index - 1]?.level !== "H4",
    )
    .map((item) => item.heading);
};
const levels = (rows: TreeRow[]) =>
  groupRows(rows)
    .flatMap((group) => group.rows)
    .map((item) => `${item.heading} ${item.level}`);

describe("an H4 stays under a subsection when it moves", () => {
  it("doesn't move the first H4 of a section's first subsection up, above its H3", () => {
    // One step up used to land "Clay" before "Soil types", straight under "Soil".
    expect(moveTarget(deepRows, 2, -1)).toBeNull();
    expect(moveRow(deepRows, "clay", -1)).toBe(deepRows);
  });

  it("takes the first H4 of a later subsection up to the end of the subsection before", () => {
    const moved = moveRow(deepRows, "gravel", -1);
    expect(shownHeadings(moved).slice(1, 7)).toEqual([
      "Soil types",
      "Clay",
      "Sand",
      "Gravel",
      "Drainage",
      "Mulch",
    ]);
    expect(rowPlace(moved, "gravel")?.parent?.heading).toBe("Soil types");
    expect(moveAnnouncement(deepRows, moved, "gravel")).toBe(
      "Moved Gravel to position 5 of 10, now a subsection of Soil types.",
    );
    // The subsection before may have no H4 yet: the H4 becomes its first.
    const bare = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a2", "A two", "H3"),
      treeRow("a21", "Deeper", "H4"),
    ];
    const joined = moveRow(bare, "a21", -1);
    expect(shownHeadings(joined)).toEqual(["A", "A one", "Deeper", "A two"]);
    expect(rowPlace(joined, "a21")?.parent?.heading).toBe("A one");
  });

  it("moves an H4 among the H4s of its subsection", () => {
    const up = moveRow(deepRows, "sand", -1);
    expect(shownHeadings(up).slice(1, 4)).toEqual([
      "Soil types",
      "Sand",
      "Clay",
    ]);
    expect(shownHeadings(moveRow(deepRows, "clay", 1))).toEqual(
      shownHeadings(up),
    );
  });

  it("takes the last H4 of a subsection down into the subsection after, in the same section", () => {
    const moved = moveRow(deepRows, "sand", 1);
    expect(shownHeadings(moved).slice(1, 6)).toEqual([
      "Soil types",
      "Clay",
      "Drainage",
      "Sand",
      "Gravel",
    ]);
    expect(rowPlace(moved, "sand")?.parent?.heading).toBe("Drainage");
    // Into a subsection with no H4 of its own, too.
    const under = moveRow(deepRows, "gravel", 1);
    expect(shownHeadings(under).slice(4, 8)).toEqual([
      "Drainage",
      "Mulch",
      "Gravel",
      "Watering",
    ]);
    expect(rowPlace(under, "gravel")?.parent?.heading).toBe("Mulch");
  });

  it("stops an H4 at its section's end: never straight under the next H2", () => {
    // "Gravel" under "Mulch", the section's last subsection; "Watering" comes next.
    const last = moveRow(deepRows, "gravel", 1);
    expect(moveRow(last, "gravel", 1)).toBe(last);
    // And the list's last row has nowhere to go.
    expect(moveRow(deepRows, "drip", 1)).toBe(deepRows);
    const short = [
      treeRow("a", "A", "H2"),
      treeRow("a1", "A one", "H3"),
      treeRow("a11", "Deeper", "H4"),
      treeRow("b", "B", "H2"),
      treeRow("b1", "B one", "H3"),
    ];
    expect(moveTarget(short, 2, 1)).toBeNull();
    expect(moveRow(short, "a11", 1)).toBe(short);
  });

  it("offers a dragged H4 only the gaps after an H3 or an H4", () => {
    // "Clay": its own place (2, 3), then after Sand, Drainage, Gravel, Mulch, Hoses and Drip;
    // not the top, not after "Soil" (1) and not after "Watering" (8).
    expect(dropGaps(deepRows, 2)).toEqual([2, 3, 4, 5, 6, 7, 9, 10]);
    expect(moveBlockTo(deepRows, "clay", 0)).toBe(deepRows);
    expect(moveBlockTo(deepRows, "clay", 1)).toBe(deepRows);
    expect(moveBlockTo(deepRows, "clay", 8)).toBe(deepRows);
    // Dropped under a subsection of another section, it is that subsection's.
    const dropped = moveBlockTo(deepRows, "clay", 9);
    expect(shownHeadings(dropped).slice(6)).toEqual([
      "Watering",
      "Hoses",
      "Clay",
      "Drip",
    ]);
    expect(rowPlace(dropped, "clay")?.parent?.heading).toBe("Hoses");
  });

  it("still takes a subsection, with its H4s, into the section beside it", () => {
    const moved = moveRow(deepRows, "mulch", 1);
    expect(shownHeadings(moved).slice(6)).toEqual([
      "Watering",
      "Mulch",
      "Hoses",
      "Drip",
    ]);
    // "Hoses" and its "Drip" go up to the end of the section before, after "Mulch".
    const withH4s = moveRow(deepRows, "hoses", -1);
    expect(shownHeadings(withH4s).slice(6)).toEqual([
      "Mulch",
      "Hoses",
      "Drip",
      "Watering",
    ]);
    expect(rowPlace(withH4s, "hoses")?.parent?.heading).toBe("Soil");
  });

  it("leaves no H4 without an H3 above it after any step or any drop", () => {
    expect(strayH4s(deepRows)).toEqual([]);
    for (const [index, item] of deepRows.entries()) {
      for (const offset of [-1, 1] as const)
        expect(strayH4s(moveRow(deepRows, item.key, offset))).toEqual([]);
      for (const gap of dropGaps(deepRows, index))
        expect(strayH4s(moveBlockTo(deepRows, item.key, gap))).toEqual([]);
    }
  });
});

describe("a subsection with H4s made a section", () => {
  it("takes its H4s up a level with it, as its subsections", () => {
    const promoted = changeLevel(deepRows, "types", "H2");
    // Nothing moves; "Clay" and "Sand" go from H4 to H3, and the subsections after it come along.
    expect(levels(promoted)).toEqual([
      "Soil H2",
      "Soil types H2",
      "Clay H3",
      "Sand H3",
      "Drainage H3",
      "Gravel H4",
      "Mulch H3",
      "Watering H2",
      "Hoses H3",
      "Drip H4",
    ]);
    expect(strayH4s(promoted)).toEqual([]);
    expect(rowPlace(promoted, "clay")?.parent?.heading).toBe("Soil types");
    expect(rowPlace(promoted, "drain")?.parent?.heading).toBe("Soil types");
    expect(rowPlace(promoted, "gravel")?.parent?.heading).toBe("Drainage");
    expect(levelAnnouncement(promoted, "types")).toBe(
      "Soil types is now a section, with its 5 subsections.",
    );
    // What approval sends: each row's new level.
    expect(
      sectionEdits(promoted)
        .slice(1, 4)
        .map((edit) => edit.heading_level),
    ).toEqual(["H2", "H3", "H3"]);
  });

  it("takes a removed H4 up too, so its Undo can't put an H4 under an H2", () => {
    const removed = removeRow(deepRows, "sand").rows;
    const promoted = changeLevel(removed, "types", "H2");
    const restored = restoreRow(promoted, "sand");
    expect(levels(restored).slice(1, 4)).toEqual([
      "Soil types H2",
      "Clay H3",
      "Sand H3",
    ]);
    expect(strayH4s(restored)).toEqual([]);
  });

  it("leaves its old H4s as subsections beside it when it is made a subsection again", () => {
    const promoted = changeLevel(deepRows, "types", "H2");
    const back = changeLevel(promoted, "types", "H3");
    // The round trip isn't the outline it started from: "Clay" and "Sand" stay H3, now beside it.
    expect(levels(back)).toEqual([
      "Soil H2",
      "Soil types H3",
      "Clay H3",
      "Sand H3",
      "Drainage H3",
      "Gravel H4",
      "Mulch H3",
      "Watering H2",
      "Hoses H3",
      "Drip H4",
    ]);
    expect(strayH4s(back)).toEqual([]);
    expect(rowPlace(back, "clay")?.parent?.heading).toBe("Soil");
    expect(levelAnnouncement(back, "types")).toBe(
      "Soil types is now a subsection of Soil.",
    );
  });

  it("keeps the H4s under their subsections when a section becomes a subsection", () => {
    const demoted = changeLevel(deepRows, "water", "H3");
    expect(levels(demoted).slice(6)).toEqual([
      "Mulch H3",
      "Watering H3",
      "Hoses H3",
      "Drip H4",
    ]);
    expect(strayH4s(demoted)).toEqual([]);
    expect(rowPlace(demoted, "drip")?.parent?.heading).toBe("Hoses");
    expect(levelAnnouncement(demoted, "water")).toBe(
      "Watering is now a subsection of Soil.",
    );
  });

  it("changes only its own level when it has no H4", () => {
    const promoted = changeLevel(deepRows, "mulch", "H2");
    expect(levels(promoted).slice(5, 8)).toEqual([
      "Gravel H4",
      "Mulch H2",
      "Watering H2",
    ]);
    expect(levelAnnouncement(promoted, "mulch")).toBe(
      "Mulch is now a section.",
    );
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
      "structure.sections:3",
      "structure.sections:0",
      "structure.sections:1",
      "structure.sections:2",
    ]);
  });

  it("sends the sections when only a level changed", () => {
    // FB2.15, gap 1: a level change alone used to leave `sections` out, so it was lost.
    const approval = buildOutlineApproval({
      ...base,
      rows: changeLevel(rows, "structure.sections:3", "H3"),
    });
    expect(approval.sections).toEqual([
      {
        id: "structure.sections:0",
        heading: "Why it matters",
        heading_level: "H2",
      },
      {
        id: "structure.sections:1",
        heading: "Cushioning",
        heading_level: "H2",
      },
      {
        id: "structure.sections:2",
        heading: "Heel drop",
        heading_level: "H3",
      },
      {
        id: "structure.sections:3",
        heading: "Getting fitted",
        heading_level: "H3",
      },
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
