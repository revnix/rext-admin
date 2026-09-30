import { render, screen, within } from "@testing-library/react";
import { WorkspaceProgressTimeline } from "@/components/workspace/workspace-progress-timeline";
import type { SSEEvent } from "@/types/sse";

const createEvent = (
  step: string,
  status: SSEEvent["status"],
  progress: number,
  message: string,
): SSEEvent => ({
  id: `${step}-${status}`,
  operation_id: "operation-1",
  scope: "workspace",
  step,
  status,
  progress,
  message,
  timestamp: new Date(0).toISOString(),
});

describe("WorkspaceProgressTimeline", () => {
  it("keeps later stages pending while competitor analysis is active", () => {
    render(
      <WorkspaceProgressTimeline
        progress={92}
        events={[
          createEvent("scrape", "completed", 20, "Scraping complete"),
          createEvent("brand_voice", "completed", 40, "Brand voice complete"),
          createEvent(
            "competitor_discovery.started",
            "started",
            92,
            "Discovering competitors via search data",
          ),
        ]}
      />,
    );

    const competitorStep = screen
      .getByText("Competitor Analysis")
      .closest(".relative");
    const finalizeStep = screen.getByText("Finalize").closest(".relative");

    expect(
      competitorStep?.querySelector("svg.animate-spin"),
    ).toBeInTheDocument();
    expect(
      finalizeStep?.querySelector("svg.animate-spin"),
    ).not.toBeInTheDocument();
    expect(
      within(finalizeStep as HTMLElement).getByText(
        "Completing workspace setup",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Persona Extraction")).not.toBeInTheDocument();
  });

  it("starts Finalize only after competitor discovery completes", () => {
    render(
      <WorkspaceProgressTimeline
        progress={98}
        events={[
          createEvent("scrape.completed", "completed", 30, "Scraping complete"),
          createEvent(
            "brand_voice.completed",
            "completed",
            90,
            "Brand voice extracted successfully",
          ),
          createEvent(
            "competitor_discovery.completed",
            "completed",
            98,
            "Competitor discovery completed",
          ),
        ]}
      />,
    );

    const competitorStep = screen
      .getByText("Competitor Analysis")
      .closest(".relative");
    const finalizeStep = screen.getByText("Finalize").closest(".relative");

    expect(
      competitorStep?.querySelector("svg.animate-spin"),
    ).not.toBeInTheDocument();
    expect(finalizeStep?.querySelector("svg.animate-spin")).toBeInTheDocument();
  });
});
