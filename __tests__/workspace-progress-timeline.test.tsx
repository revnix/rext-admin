import { render, screen } from "@testing-library/react";

import { WorkspaceProgressTimeline } from "@/components/workspace/workspace-progress-timeline";

describe("WorkspaceProgressTimeline", () => {
  it("marks alternative completion event names as completed", () => {
    render(
      <WorkspaceProgressTimeline
        progress={100}
        events={[
          {
            id: "1",
            operation_id: "op-1",
            scope: "workspace",
            step: "scrape.completed",
            status: "completed",
            message: "Website scraped",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "2",
            operation_id: "op-1",
            scope: "workspace",
            step: "brand_voice.completed",
            status: "completed",
            message: "Brand voice extracted",
            timestamp: "2026-01-01T00:00:01.000Z",
          },
          {
            id: "3",
            operation_id: "op-1",
            scope: "workspace",
            step: "competitor.completed",
            status: "completed",
            message: "Competitor analysis finished",
            timestamp: "2026-01-01T00:00:02.000Z",
          },
          {
            id: "4",
            operation_id: "op-1",
            scope: "workspace",
            step: "persona.completed",
            status: "completed",
            message: "Persona extraction finished",
            timestamp: "2026-01-01T00:00:03.000Z",
          },
          {
            id: "5",
            operation_id: "op-1",
            scope: "workspace",
            step: "pipeline.completed",
            status: "completed",
            message: "Workspace ready",
            timestamp: "2026-01-01T00:00:04.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Competitor Analysis")).toHaveClass(
      "text-green-900",
    );
    expect(screen.getByText("Persona Extraction")).toHaveClass(
      "text-green-900",
    );
    expect(screen.getByText("Finalize")).toHaveClass("text-green-900");
  });

  it("falls back to overall progress when step-specific events are missing", () => {
    render(
      <WorkspaceProgressTimeline
        progress={90}
        events={[
          {
            id: "1",
            operation_id: "op-1",
            scope: "workspace",
            step: "scrape.completed",
            status: "completed",
            message: "Website scrubbed",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "2",
            operation_id: "op-1",
            scope: "workspace",
            step: "brand_voice.completed",
            status: "completed",
            message: "Brand voice extracted successfully",
            timestamp: "2026-01-01T00:00:01.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Competitor Analysis")).toHaveClass(
      "text-green-900",
    );
    expect(screen.getByText("Persona Extraction")).toHaveClass(
      "text-green-900",
    );
    expect(screen.getByText("Finalize")).toHaveClass("text-blue-900");
  });
});
