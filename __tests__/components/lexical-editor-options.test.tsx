/**
 * The shared editor's options for a page that brings its own tools (task 706): no fixed toolbar,
 * a slot for more plugins, and no frame round the text. The defaults stay as they were.
 */

import { render, screen } from "@testing-library/react";
import LexicalEditor from "@/components/ui/lexical-editor";

describe("LexicalEditor's options", () => {
  it("keeps its fixed toolbar and its frame by default", () => {
    const { container } = render(<LexicalEditor initialValue="Hello" />);
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(container.querySelector('[contenteditable="true"]')).toHaveClass(
      "p-6",
    );
  });

  it("drops the toolbar and the frame, and mounts the page's plugins, on request", () => {
    const { container } = render(
      <LexicalEditor
        initialValue="Hello"
        toolbar={false}
        bare
        plugins={<span>the page's plugin</span>}
      />,
    );
    expect(screen.queryByTitle("Bold")).toBeNull();
    expect(screen.getByText("the page's plugin")).toBeInTheDocument();
    const text = container.querySelector('[contenteditable="true"]');
    expect(text).toHaveClass("p-0");
    expect(text).not.toHaveClass("p-6");
  });

  it("mounts no extra plugins while read-only", () => {
    render(
      <LexicalEditor
        initialValue="Hello"
        readOnly
        plugins={<span>the page's plugin</span>}
      />,
    );
    expect(screen.queryByText("the page's plugin")).toBeNull();
  });
});
