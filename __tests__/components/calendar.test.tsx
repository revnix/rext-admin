/**
 * The shadcn Calendar on react-day-picker 10: single and range selection,
 * month navigation, and the app's own "today" ring (a ring on today's date
 * while it is not selected, instead of the registry's filled background).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/ui/calendar";

const month = new Date(2026, 9, 1); // October 2026

describe("Calendar", () => {
  it("selects one day and reports it", async () => {
    const onSelect = jest.fn();
    const { container } = render(
      <Calendar
        mode="single"
        month={month}
        selected={new Date(2026, 9, 12)}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(
      container.querySelector('[data-selected-single="true"]'),
    ).toHaveTextContent("12");
    await userEvent.click(screen.getByRole("button", { name: /October 20/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].getDate()).toBe(20);
  });

  it("marks the ends and the middle of a range", () => {
    const { container } = render(
      <Calendar
        mode="range"
        month={month}
        selected={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 8) }}
      />,
    );
    expect(
      container.querySelector('[data-range-start="true"]'),
    ).toHaveTextContent("5");
    expect(
      container.querySelector('[data-range-end="true"]'),
    ).toHaveTextContent("8");
    expect(
      container.querySelectorAll('[data-range-middle="true"]'),
    ).toHaveLength(2);
  });

  it("moves to the next month", async () => {
    render(<Calendar mode="single" defaultMonth={month} />);
    await userEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("rings today only while it is not selected", () => {
    const today = new Date();
    const unselected = render(<Calendar mode="single" />);
    expect(
      unselected.container.querySelector('[data-today-unselected="true"]'),
    ).toHaveTextContent(String(today.getDate()));
    unselected.unmount();
    // Without onSelect, selected is only read on the first render.
    const selected = render(
      <Calendar mode="single" selected={today} onSelect={() => {}} />,
    );
    expect(
      selected.container.querySelector('[data-selected-single="true"]'),
    ).toHaveTextContent(String(today.getDate()));
    expect(
      selected.container.querySelector('[data-today-unselected="true"]'),
    ).toBeNull();
  });
});
