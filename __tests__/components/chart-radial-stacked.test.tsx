/**
 * The keyword difficulty gauge on recharts 3 and the shadcn Chart: it draws
 * its radial bars and writes the score and its band in the middle. The gauge
 * only appears in a generation run's results, so this is where it is checked.
 */

import { render, screen, waitFor } from "@testing-library/react";
import {
  ChartRadialStacked,
  getDifficultyLabel,
} from "@/components/ui/content/chart-radial-stacked";

// jsdom lays nothing out, so ResponsiveContainer would measure 0 by 0 and draw
// nothing: give the chart a fixed 320 by 200 box instead.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  const { cloneElement } = jest.requireActual("react");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      cloneElement(children, { width: 320, height: 200 }),
  };
});

describe("ChartRadialStacked", () => {
  it("draws the gauge with the score and its band", async () => {
    const { container } = render(<ChartRadialStacked difficultyScore={45} />);
    // The score and the remainder, each drawn as sectors of the gauge once
    // recharts has measured the chart (after the first render in v3).
    await waitFor(() =>
      expect(
        container.querySelectorAll(".recharts-sector").length,
      ).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("names the bands", () => {
    expect(getDifficultyLabel(5)).toBe("Easy");
    expect(getDifficultyLabel(30)).toBe("Medium");
    expect(getDifficultyLabel(71)).toBe("Super Hard");
  });
});
