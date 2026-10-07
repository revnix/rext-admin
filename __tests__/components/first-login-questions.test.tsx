import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirstLoginQuestions } from "@/components/onboarding/first-login-questions";

const shouldShow = jest.fn();
const saveAnswers = jest.fn();
const complete = jest.fn();
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    onboarding: {
      shouldShow: () => shouldShow(),
      saveAnswers: (answers: unknown) => saveAnswers(answers),
      complete: () => complete(),
    },
  },
}));

const renderQuestions = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FirstLoginQuestions />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  saveAnswers.mockResolvedValue({});
  complete.mockResolvedValue({});
});

describe("FirstLoginQuestions", () => {
  it("asks the four questions when the backend says this user hasn't been asked", async () => {
    shouldShow.mockResolvedValue({ should_show: true });
    renderQuestions();
    expect(
      await screen.findByRole("dialog", {
        name: "A few questions before you start",
      }),
    ).toBeVisible();
    for (const label of [
      "Your industry",
      "Your role",
      "Your main goal",
      "How you heard about Rext",
    ]) {
      expect(screen.getByText(label)).toBeVisible();
    }
  });

  it("asks nothing when the backend says not to (an invited user, an admin, done already)", async () => {
    shouldShow.mockResolvedValue({ should_show: false });
    renderQuestions();
    await waitFor(() => expect(shouldShow).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ends onboarding on Skip, saving no answers, and closes", async () => {
    shouldShow.mockResolvedValue({ should_show: true });
    renderQuestions();
    await userEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect(saveAnswers).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("ends onboarding on Continue with nothing chosen, saving nothing", async () => {
    shouldShow.mockResolvedValue({ should_show: true });
    renderQuestions();
    await userEvent.click(
      await screen.findByRole("button", { name: "Continue" }),
    );
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect(saveAnswers).not.toHaveBeenCalled();
  });
});
