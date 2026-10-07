/**
 * The analytics switch in Settings, Data (rext-control task 712): it shows the choice as it stands
 * and a change is recorded at once.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsPreference } from "@/components/account-settings/analytics-preference";
import { analyticsMode, readConsent } from "@/lib/analytics-consent";

jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: jest.fn(),
}));

const mode = analyticsMode as jest.MockedFunction<typeof analyticsMode>;
const realFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = realFetch;
});

const theSwitch = () =>
  screen.getByRole("switch", { name: "Measure how I use Rext" });

it("is on where analytics is on, and off records a no", async () => {
  mode.mockResolvedValue("full");
  render(<AnalyticsPreference />);
  await waitFor(() => expect(theSwitch()).toBeChecked());

  await userEvent.click(theSwitch());

  expect(theSwitch()).not.toBeChecked();
  expect(readConsent()).toBe("denied");
});

it("is off until the person is asked, and on records a yes", async () => {
  mode.mockResolvedValue("wait");
  render(<AnalyticsPreference />);
  await waitFor(() => expect(theSwitch()).toBeEnabled());
  expect(theSwitch()).not.toBeChecked();

  await userEvent.click(theSwitch());

  expect(theSwitch()).toBeChecked();
  expect(readConsent()).toBe("granted");
});
