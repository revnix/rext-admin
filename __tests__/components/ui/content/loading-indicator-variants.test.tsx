import "@testing-library/jest-dom";
import { render, screen } from "@/__tests__/utils/test-utils";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";

describe("LoadingIndicatorVariants", () => {
    it("renders fallback step index when no direct status match exists", () => {
        render(
            <LoadingIndicatorVariants
                step="topic"
                isLoading
                loadingStatus="Unknown Step..."
                completedSteps={[]}
                steps={[
                    { id: "Topic Generation", label: "Content Type Generation" },
                    { id: "Generate Outline", label: "Generating Content Outline" },
                ]}
            />,
        );

        expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
        expect(screen.getByText("Content Type Generation...")).toBeInTheDocument();
    });
});