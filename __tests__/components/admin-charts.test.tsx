/**
 * The super-admin charts the seeded local stack has no data for (email volume,
 * the monitoring usage trends and the endpoint bars), drawn on recharts 3 with
 * sample data. Their legends keep the order the chart declares its series in:
 * recharts 3 sorts legends by name unless told otherwise.
 */

import { render, waitFor } from "@testing-library/react";
import { EmailVolumeChart } from "@/components/admin/email/email-volume-chart";
import { UsageCharts } from "@/components/admin/monitoring/usage-charts";

// jsdom lays nothing out, so ResponsiveContainer would measure 0 by 0 and draw
// nothing: give each chart a fixed 640 by 300 box instead.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  const { cloneElement } = jest.requireActual("react");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      cloneElement(children, { width: 640, height: 300 }),
  };
});

const legend = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".recharts-legend-item-text")).map(
    (el) => el.textContent,
  );

describe("EmailVolumeChart", () => {
  it("draws five lines with the legend in their declared order", async () => {
    const day = (date: string, sent: number) => ({
      date,
      sent,
      delivered: sent - 1,
      opened: 3,
      clicked: 1,
      failed: 1,
    });
    const { container } = render(
      <EmailVolumeChart
        isLoading={false}
        data={[
          day("2026-10-01", 12),
          day("2026-10-02", 9),
          day("2026-10-03", 15),
        ]}
      />,
    );
    await waitFor(() =>
      expect(legend(container)).toEqual([
        "Sent",
        "Delivered",
        "Opened",
        "Clicked",
        "Failed",
      ]),
    );
    expect(container.querySelectorAll(".recharts-line-curve")).toHaveLength(5);
  });
});

describe("UsageCharts", () => {
  it("draws the trends and the endpoint bars", async () => {
    const { container } = render(
      <UsageCharts
        isLoading={false}
        period="7_days"
        onPeriodChange={() => {}}
        trends={[
          {
            date: "2026-10-01",
            content_created: 4,
            active_users: 3,
            workspaces_created: 1,
          },
          {
            date: "2026-10-02",
            content_created: 6,
            active_users: 5,
            workspaces_created: 0,
          },
        ]}
        stats={{
          period: "7_days",
          api_calls: {
            total: 30,
            by_endpoint: [
              { endpoint: "/content", count: 20 },
              { endpoint: "/keywords", count: 10 },
            ],
          },
          content_generation: { total: 10, successful: 9, failed: 1 },
          user_activity: {
            active_users: 5,
            new_users: 2,
            new_workspaces: 1,
            sessions: 12,
          },
        }}
      />,
    );
    await waitFor(() =>
      expect(legend(container)).toEqual(
        expect.arrayContaining([
          "Content Created",
          "Active Users",
          "Workspaces",
        ]),
      ),
    );
    const trendLegend = legend(container).filter((t) =>
      ["Content Created", "Active Users", "Workspaces"].includes(t ?? ""),
    );
    expect(trendLegend).toEqual([
      "Content Created",
      "Active Users",
      "Workspaces",
    ]);
    await waitFor(() =>
      expect(
        container.querySelectorAll(".recharts-bar-rectangle").length,
      ).toBeGreaterThanOrEqual(2),
    );
  });
});
