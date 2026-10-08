import { renderHook } from "@testing-library/react";
import { type DraftSource, useFirstDraft } from "@/hooks/use-first-draft";

type Content = { title: string };

const at = (
  props: Partial<DraftSource<Content>> = {},
): DraftSource<Content> => ({
  thread: "t1",
  body: "",
  content: null,
  final: false,
  ...props,
});

const draft = at({ body: "## One\n\nDraft.", content: { title: "Draft" } });

describe("useFirstDraft (task 773)", () => {
  it("holds nothing before the writer's text arrives", () => {
    const { result } = renderHook(() => useFirstDraft(at()));
    expect(result.current).toBeNull();
  });

  it("holds the first text as it arrived, through every later stage's text", () => {
    const { result, rerender } = renderHook((props) => useFirstDraft(props), {
      initialProps: draft,
    });
    expect(result.current).toEqual({
      thread: "t1",
      body: "## One\n\nDraft.",
      content: { title: "Draft" },
    });
    // The rewrite, then the checks, each report their own text: the reader keeps the draft.
    rerender(
      at({ body: "## One\n\nRewritten.", content: { title: "Rewritten" } }),
    );
    rerender(at({ body: "## One\n\nChecked.", content: { title: "Checked" } }));
    expect(result.current?.body).toBe("## One\n\nDraft.");
    expect(result.current?.content).toEqual({ title: "Draft" });
  });

  it("lets go once the article is final: the final text takes its place", () => {
    const { result, rerender } = renderHook((props) => useFirstDraft(props), {
      initialProps: draft,
    });
    rerender(at({ body: "## One\n\nFinal.", final: true }));
    expect(result.current).toBeNull();
  });

  it("holds nothing for an article that arrives finished", () => {
    const { result } = renderHook(() =>
      useFirstDraft(at({ body: "## One\n\nSaved.", final: true })),
    );
    expect(result.current).toBeNull();
  });

  it("starts over when the text is cleared for a new run", () => {
    const { result, rerender } = renderHook((props) => useFirstDraft(props), {
      initialProps: draft,
    });
    rerender(at());
    expect(result.current).toBeNull();
    rerender(at({ body: "## Two\n\nThe next run's draft." }));
    expect(result.current?.body).toBe("## Two\n\nThe next run's draft.");
  });

  it("never carries one thread's draft to another", () => {
    const { result, rerender } = renderHook((props) => useFirstDraft(props), {
      initialProps: draft,
    });
    rerender(at({ thread: "t2", body: "## Other\n\nAnother run." }));
    expect(result.current).toEqual({
      thread: "t2",
      body: "## Other\n\nAnother run.",
      content: null,
    });
  });
});
