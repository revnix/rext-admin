import "@testing-library/jest-dom";
import { render, screen } from "@/__tests__/utils/test-utils";
import { ProgressBar } from "@/components/ui/typeform/progress-bar";

describe("ProgressBar", () => {
    it("clamps progress and renders step counter", () => {
        render(
            <ProgressBar progress={120} currentStep={3} totalSteps={5} showStepCounter />,
        );

        const bar = screen.getByRole("progressbar");
        expect(bar).toHaveAttribute("aria-valuenow", "100");
        expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
        expect(screen.getByText("100%")).toBeInTheDocument();
    });
});