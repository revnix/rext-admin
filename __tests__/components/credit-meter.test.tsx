/**
 * The sidebar's credits meter (FB2.4, rext-control#685): below 1024 px it is the one way to usage, so
 * on a phone it closes the sheet as it opens the page, like the sidebar's other links.
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

it("closes the phone's sheet as it opens usage", () => {
  useSubscriptionStore.setState({
    credits: {
      current_credits: 412,
      credits_per_month: 1000,
      credits_reset_date: null,
      articles_remaining: 27,
      plan_name: "Growth",
    } as never,
    fetchCredits: jest.fn().mockResolvedValue(undefined),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CreditMeter />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("link", { name: /credits.*Open usage/i }));
  expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
});
