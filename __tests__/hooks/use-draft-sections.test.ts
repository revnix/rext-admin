import { act, renderHook } from "@testing-library/react";
import {
  SECTION_GAP_WAIT_MS,
  useDraftSections,
} from "@/hooks/use-draft-sections";

const event = (index: number, over: Record<string, unknown> = {}) => ({
  type: "section",
  phase: "draft",
  index,
  of: 5,
  level: 2,
  heading: `Section ${index}`,
  markdown: `Text ${index}.`,
  ...over,
});

const text = (...indexes: number[]) =>
  indexes.map((index) => `## Section ${index}\n\nText ${index}.`).join("\n\n");

const start = (thread = "t1", final = false) =>
  renderHook((props) => useDraftSections(props), {
    initialProps: { thread: thread as string | null, final },
  });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useDraftSections (task 773, part B)", () => {
  it("has no text before the first section", () => {
    const { result } = start();
    expect(result.current.body).toBe("");
  });

  it("adds each section under the ones before it, and ignores every other event", () => {
    const { result } = start();
    act(() => result.current.add(event(1)));
    expect(result.current.body).toBe(text(1));
    act(() => {
      result.current.add({ type: "token", content: "A" });
      result.current.add(event(2));
    });
    expect(result.current.body).toBe(text(1, 2));
  });

  it("holds a section that arrived early until the ones before it are there", () => {
    const { result } = start();
    act(() => result.current.add(event(3)));
    expect(result.current.body).toBe("");
    act(() => result.current.add(event(1)));
    expect(result.current.body).toBe(text(1));
    act(() => result.current.add(event(2)));
    expect(result.current.body).toBe(text(1, 2, 3));
  });

  it("shows a held section once the one it waits for hasn't come for a while", () => {
    const { result } = start();
    act(() => {
      result.current.add(event(1));
      result.current.add(event(3));
    });
    expect(result.current.body).toBe(text(1));
    act(() => {
      jest.advanceTimersByTime(SECTION_GAP_WAIT_MS - 1);
    });
    expect(result.current.body).toBe(text(1));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.body).toBe(text(1, 3));
  });

  it("starts that wait again when an earlier section arrives", () => {
    const { result } = start();
    act(() => result.current.add(event(4)));
    act(() => {
      jest.advanceTimersByTime(SECTION_GAP_WAIT_MS - 1);
    });
    act(() => result.current.add(event(1)));
    act(() => {
      jest.advanceTimersByTime(SECTION_GAP_WAIT_MS - 1);
    });
    expect(result.current.body).toBe(text(1));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.body).toBe(text(1, 4));
  });

  it("shows no sections of a run joined part-way: the ones before them were never sent again", () => {
    const { result } = start();
    act(() => {
      result.current.add(event(4));
      result.current.add(event(5));
    });
    act(() => {
      jest.advanceTimersByTime(SECTION_GAP_WAIT_MS * 3);
    });
    expect(result.current.body).toBe("");
  });

  it("takes a section sent again in the first one's place", () => {
    const { result } = start();
    act(() => {
      result.current.add(event(1));
      result.current.add(event(1, { markdown: "Written again." }));
    });
    expect(result.current.body).toBe("## Section 1\n\nWritten again.");
  });

  it("lets go of the sections when the writer starts its answer again, and takes the new ones", () => {
    const { result } = start();
    act(() => {
      result.current.add(event(1));
      result.current.add(event(2));
    });
    act(() => result.current.add({ type: "section", phase: "reset" }));
    expect(result.current.body).toBe("");
    // The new answer leaves the second section out: it doesn't stay from the answer before.
    act(() => result.current.add(event(1, { markdown: "Written again." })));
    expect(result.current.body).toBe("## Section 1\n\nWritten again.");
  });

  it("carries nothing to another thread", () => {
    const { result, rerender } = start();
    act(() => result.current.add(event(1)));
    rerender({ thread: "t2", final: false });
    expect(result.current.body).toBe("");
  });

  it("lets go of the sections once the article is final, so a later run starts clean", () => {
    const { result, rerender } = start();
    act(() => result.current.add(event(1)));
    rerender({ thread: "t1", final: true });
    expect(result.current.body).toBe("");
    rerender({ thread: "t1", final: false });
    expect(result.current.body).toBe("");
  });
});
