/**
 * The content statuses are the backend's ten (C3a #380): each has a word, the library lists all but
 * the trash, and nothing names a state the backend doesn't have.
 */

import { render, screen } from "@testing-library/react";
import {
  ContentStatusBadge,
  contentStatusLabel,
} from "@/components/content/content-status-badge";
import { CONTENT_LIST_STATUSES } from "@/lib/search-params/content";
import { CONTENT_STATUSES } from "@/types/content";

describe("the content statuses", () => {
  it("are the backend's ten, from its transition table", () => {
    expect([...CONTENT_STATUSES].sort()).toEqual(
      [
        "archived",
        "deleted",
        "draft",
        "failed",
        "generating",
        "published",
        "ready",
        "review",
        "scheduled",
        "trashed",
      ].sort(),
    );
  });

  it("each has its own word", () => {
    const words = CONTENT_STATUSES.map(contentStatusLabel);
    for (const [index, status] of CONTENT_STATUSES.entries()) {
      expect(words[index]).not.toBe(status);
    }
    expect(new Set(words).size).toBe(CONTENT_STATUSES.length);
  });

  it("the library lists every one but the trash", () => {
    expect([...CONTENT_LIST_STATUSES].sort()).toEqual(
      CONTENT_STATUSES.filter(
        (status) => status !== "trashed" && status !== "deleted",
      ).sort(),
    );
  });

  it("shows a status it doesn't know as the backend sent it", () => {
    render(<ContentStatusBadge status="something_new" />);
    expect(screen.getByText("something_new")).toBeInTheDocument();
  });
});
