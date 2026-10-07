/**
 * The shell's notice while the API is away (rext-control task 759): one "Rext is updating" until
 * the API answers again, then whatever failed meanwhile loads again by itself.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { ServerAwayNotice } from "@/components/server-away-notice";
import {
  isServerAway,
  reportServerAway,
  reportServerBack,
} from "@/lib/api-client/server-away";

jest.mock("sonner", () => ({
  toast: { info: jest.fn(), dismiss: jest.fn() },
}));
jest.mock("@/lib/api-client/server-away", () => ({
  ...jest.requireActual("@/lib/api-client/server-away"),
  serverAnswers: jest.fn(),
}));

const { toast } = jest.requireMock("sonner") as {
  toast: { info: jest.Mock; dismiss: jest.Mock };
};
const serverAnswers = jest.requireMock("@/lib/api-client/server-away")
  .serverAnswers as jest.Mock;

function mount() {
  const queryClient = new QueryClient();
  const invalidate = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={queryClient}>
      <ServerAwayNotice />
    </QueryClientProvider>,
  );
  return invalidate;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  act(() => reportServerBack());
});
afterEach(() => {
  jest.useRealTimers();
});

it("says nothing while the API answers", () => {
  mount();
  expect(toast.info).not.toHaveBeenCalled();
});

it("says Rext is updating, then reloads what failed once the API answers again", async () => {
  const invalidate = mount();
  serverAnswers.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

  act(() => reportServerAway());
  expect(toast.info).toHaveBeenCalledTimes(1);
  expect(toast.info).toHaveBeenCalledWith(
    "Rext is updating",
    expect.objectContaining({
      description: "Back in a minute.",
      duration: Number.POSITIVE_INFINITY,
    }),
  );

  // Still away at the first look: the notice stays.
  await act(() => jest.advanceTimersByTimeAsync(5000));
  expect(isServerAway()).toBe(true);
  expect(toast.dismiss).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();

  await act(() => jest.advanceTimersByTimeAsync(5000));
  expect(isServerAway()).toBe(false);
  expect(toast.dismiss).toHaveBeenCalledWith(
    toast.info.mock.calls[0][1].id as string,
  );
  // Only the queries that failed are asked for again.
  const { predicate } = invalidate.mock.calls[0][0] as {
    predicate: (query: { state: { status: string } }) => boolean;
  };
  expect(predicate({ state: { status: "error" } })).toBe(true);
  expect(predicate({ state: { status: "success" } })).toBe(false);

  // The watch has ended.
  await act(() => jest.advanceTimersByTimeAsync(30000));
  expect(serverAnswers).toHaveBeenCalledTimes(2);
});

it("stops watching after three minutes without an answer, and takes the notice away", async () => {
  const invalidate = mount();
  serverAnswers.mockResolvedValue(false);

  act(() => reportServerAway());
  await act(() => jest.advanceTimersByTimeAsync(3 * 60 * 1000));

  expect(serverAnswers).toHaveBeenCalledTimes(36);
  expect(isServerAway()).toBe(false);
  expect(toast.dismiss).toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});
