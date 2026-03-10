import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultiSelectCard } from "@/components/ui/typeform/multi-select-card";

describe("MultiSelectCard", () => {
    it("renders correctly and responds to clicks", () => {
        const onToggle = jest.fn();
        render(
            <MultiSelectCard
                label="Option 1"
                description="Desc"
                selected={true}
                onToggle={onToggle}
            />
        );

        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Desc")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button"));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
