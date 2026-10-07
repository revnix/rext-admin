/**
 * G59c (rext-control#633): a server's reason can be one long unbroken string (a remote's HTML page,
 * a signed URL), so the notices that show one wrap anywhere instead of overflowing their box.
 */

import { render, screen } from "@testing-library/react";
import { RunNotice } from "@/components/generate-content/run-notice";
import { Notice } from "@/components/ui/notice";

const LONG_REASON = `Image request failed: HTTP 404 for https://example.test/${"a".repeat(2000)}`;

describe("a long server reason", () => {
  it("wraps anywhere in a Notice", () => {
    render(
      <Notice tone="danger" title="Publishing stopped">
        {LONG_REASON}
      </Notice>,
    );
    expect(screen.getByText(LONG_REASON)).toHaveClass("wrap-anywhere");
  });

  it("wraps anywhere in a RunNotice", () => {
    render(
      <RunNotice
        title="The analysis stopped"
        message={LONG_REASON}
        actionLabel="Start again"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText(LONG_REASON)).toHaveClass("wrap-anywhere");
  });
});
