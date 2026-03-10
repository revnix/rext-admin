import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ChartRadialStacked } from "@/components/ui/content/chart-radial-stacked";

// Mock recharts because ResponsiveContainer needs a width/height that JSDOM doesn't natively provide
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => (
            <div style={{ width: 800, height: 800 }}>{children}</div>
        ),
    };
});

describe("ChartRadialStacked", () => {
    it("renders with a difficulty score and label", () => {
        render(<ChartRadialStacked difficultyScore={85} />);

        // Check if the score and mapped label string are rendered
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("Super Hard")).toBeInTheDocument();
    });

    it("handles empty or zero score", () => {
        render(<ChartRadialStacked />);

        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getByText("Easy")).toBeInTheDocument();
    });
});
