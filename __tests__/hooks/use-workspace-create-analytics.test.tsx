/**
 * Creating a workspace, moment by moment, for analytics (rext-control task 854): where a newcomer
 * stops. The form seen, a field left with something in it, the wait started, left before it ended,
 * the review reached, finished. Never anything that was typed.
 */
import { renderHook } from "@testing-library/react";

import { useWorkspaceCreateAnalytics } from "@/hooks/use-workspace-create-analytics";
import { analytics } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
const track = analytics.track as jest.Mock;
const sent = (name: string) =>
  track.mock.calls.filter(([event]) => event === name);

type Props = Parameters<typeof useWorkspaceCreateAnalytics>[0];
const form: Props = {
  step: 0,
  firstWorkspace: true,
  withWebsite: true,
  stage: "reading",
};
const mount = (props: Props = form) =>
  renderHook((now: Props) => useWorkspaceCreateAnalytics(now), {
    initialProps: props,
  });

beforeEach(() => {
  track.mockClear();
  jest.useFakeTimers().setSystemTime(new Date("2026-10-08T11:40:00Z"));
});
afterEach(() => jest.useRealTimers());

describe("the create form, for analytics", () => {
  it("says the form was seen, once, and whether it is the person's first workspace", () => {
    const { rerender } = mount();
    rerender({ ...form, stage: "voice" });
    expect(sent("workspace_create_viewed")).toEqual([
      ["workspace_create_viewed", { first_workspace: true }],
    ]);
  });

  it("names a field a person typed in and left, once, and never what it holds", () => {
    const { result } = mount();
    result.current.fieldTyped("name");
    result.current.fieldLeft("name", "");
    result.current.fieldLeft("name", "   ");
    expect(sent("workspace_create_field_filled")).toHaveLength(0);

    result.current.fieldLeft("name", "Acme Forge");
    result.current.fieldLeft("name", "Acme Forge Co");
    result.current.fieldTyped("website");
    result.current.fieldLeft("website", "acme-forge.com");
    expect(sent("workspace_create_field_filled")).toEqual([
      ["workspace_create_field_filled", { field: "name" }],
      ["workspace_create_field_filled", { field: "website" }],
    ]);
    expect(JSON.stringify(track.mock.calls)).not.toMatch(/acme/i);
  });

  it("doesn't count a field the browser filled: a value alone is no sign of a person", () => {
    const { result } = mount();
    // The form arrived with both fields filled, and focus passed through them.
    result.current.fieldLeft("name", "Mary Example");
    result.current.fieldLeft("website", "mary@example.com");
    expect(sent("workspace_create_field_filled")).toHaveLength(0);
  });

  it("says which way in was chosen, that Create was pressed, and a refusal by its kind", () => {
    const { result } = mount({ ...form, withWebsite: false });
    result.current.wayChosen("description");
    result.current.submitted();
    result.current.refused("form", { field: "description" });
    result.current.refused("backend", { status: 500 });

    expect(sent("workspace_create_way_chosen")[0][1]).toEqual({
      way: "description",
    });
    expect(sent("workspace_create_submitted")[0][1]).toEqual({
      with_website: false,
      first_workspace: true,
    });
    expect(sent("workspace_create_refused").map(([, said]) => said)).toEqual([
      {
        kind: "form",
        field: "description",
        status: undefined,
        with_website: false,
        first_workspace: true,
      },
      {
        kind: "backend",
        field: undefined,
        status: 500,
        with_website: false,
        first_workspace: true,
      },
    ]);
  });
});

describe("the wait and the review, for analytics", () => {
  it("says the wait started, then the review reached with the seconds between", () => {
    const { rerender } = mount();
    rerender({ ...form, step: 1 });
    expect(sent("workspace_wait_started")).toEqual([
      ["workspace_wait_started", { with_website: true }],
    ]);

    jest.advanceTimersByTime(74_000);
    rerender({ ...form, step: 2, stage: "competitors" });
    expect(sent("workspace_review_reached")).toEqual([
      ["workspace_review_reached", { seconds: 74, with_website: true }],
    ]);
  });

  it("says a wait was left, once, with where it was, sent as the page goes", () => {
    const { rerender } = mount();
    rerender({ ...form, step: 1 });
    jest.advanceTimersByTime(30_000);
    rerender({ ...form, step: 1, stage: "competitors" });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));

    expect(sent("workspace_wait_left")).toEqual([
      [
        "workspace_wait_left",
        { seconds: 30, stage: "competitors", with_website: true },
        { leaving: true },
      ],
    ]);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  it("says so too when another page is opened during the wait", () => {
    const { rerender, unmount } = mount();
    rerender({ ...form, step: 1, stage: "voice" });
    jest.advanceTimersByTime(12_000);
    unmount();
    expect(sent("workspace_wait_left")[0][1]).toEqual({
      seconds: 12,
      stage: "voice",
      with_website: true,
    });
  });

  it("says nothing of leaving on the form, or once the review was reached", () => {
    const { rerender, unmount } = mount();
    window.dispatchEvent(new Event("pagehide"));
    rerender({ ...form, step: 1 });
    rerender({ ...form, step: 2 });
    window.dispatchEvent(new Event("pagehide"));
    unmount();
    expect(sent("workspace_wait_left")).toHaveLength(0);
  });

  it("says the review was finished, how long it took and whether anything was changed", () => {
    const { rerender, result } = mount();
    rerender({ ...form, step: 1 });
    rerender({ ...form, step: 2 });
    jest.advanceTimersByTime(41_000);
    result.current.reviewFinished(true);
    expect(sent("workspace_review_finished")).toEqual([
      ["workspace_review_finished", { seconds_on_review: 41, changed: true }],
    ]);
  });
});
