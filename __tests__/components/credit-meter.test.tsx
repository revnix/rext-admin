/**
 * The sidebar's credits meter (FB2.4, rext-control#685): below 1024 px it is the one way to usage, so
 * on a phone it closes the sheet as it opens the page, like the sidebar's other links. And it never
 * writes a balance larger than its allowance as "157 of 60" (task 784).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreditMeter } from "@/components/shell/credit-meter";
import { useSubscriptionStore } from "@/stores/subscription-store";

const mockSetOpenMobile = jest.fn();
jest.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ setOpenMobile: mockSetOpenMobile }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/navigation", () => ({ useParams: () => ({}) }));

function renderMeter(credits: Record<string, unknown>) {
  useSubscriptionStore.setState({
    credits: {
      credits_reset_date: null,
      plan_name: "Growth",
      ...credits,
    } as never,
    fetchCredits: jest.fn().mockResolvedValue(undefined),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CreditMeter />
    </QueryClientProvider>,
  );
  return screen.getByRole("link", { name: /Open usage/i });
}
/** The bar's filled share, from the width the Meter gives it. */
const barWidth = (link: HTMLElement) =>
  (link.querySelector('[data-slot="meter"] > *') as HTMLElement | null)?.style
    .width;

it("closes the phone's sheet as it opens usage", () => {
  const link = renderMeter({
    current_credits: 412,
    credits_per_month: 1000,
    articles_remaining: 27,
  });
  fireEvent.click(link);
  expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
});

describe("the balance against the allowance (task 784)", () => {
  it("reads N of M under the allowance", () => {
    const link = renderMeter({
      current_credits: 412,
      monthly_credits: 412,
      credits_per_month: 1000,
      articles_remaining: 27,
    });
    expect(link).toHaveTextContent("412 of 1,000 credits");
    expect(link).toHaveAccessibleName(
      "412 of 1,000 credits left, about 27 articles. Open usage",
    );
    expect(barWidth(link)).toBe("41%");
  });

  it("shows the balance alone, with a full bar, when credits were added above the allowance", () => {
    // Seen on staging: 150 credits added to a trial of 60 read "157 of 60 credits".
    const link = renderMeter({
      current_credits: 157,
      monthly_credits: 157,
      credits_per_month: 60,
      articles_remaining: 10,
      bonus: null,
    });
    expect(link).toHaveTextContent("157 credits");
    expect(link).not.toHaveTextContent("of 60");
    expect(barWidth(link)).toBe("100%");
  });

  it("shows a launch buyer all they can spend, and names the bonus for a screen reader", () => {
    const link = renderMeter({
      current_credits: 2000,
      monthly_credits: 1000,
      credits_per_month: 1000,
      articles_remaining: 133,
      bonus: {
        label: "Launch bonus",
        promotion: "launch",
        credits: 1000,
        granted: 1000,
        expires_at: "2026-10-14T06:59:00Z",
      },
    });
    expect(link).toHaveTextContent("2,000 credits");
    expect(link).not.toHaveTextContent("of 1,000");
    expect(link).toHaveAccessibleName(
      "2,000 credits left, 1,000 monthly + 1,000 launch bonus, about 133 articles. Open usage",
    );
    expect(barWidth(link)).toBe("100%");
  });

  it("goes back to N of M once the bonus and the month's spending bring it under", () => {
    const link = renderMeter({
      current_credits: 700,
      monthly_credits: 500,
      credits_per_month: 1000,
      articles_remaining: 46,
      bonus: {
        label: "Launch bonus",
        promotion: "launch",
        credits: 200,
        granted: 1000,
        expires_at: null,
      },
    });
    expect(link).toHaveTextContent("700 of 1,000 credits");
    expect(barWidth(link)).toBe("70%");
  });

  it("draws no bar on a plan with no allowance", () => {
    const link = renderMeter({
      current_credits: 120,
      credits_per_month: null,
      articles_remaining: null,
    });
    expect(link).toHaveTextContent("120 credits");
    expect(link.querySelector('[data-slot="meter"]')).toBeNull();
  });
});
