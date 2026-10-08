/**
 * The editor's image slot (task 706). A slot the person put in has no description, so one is asked
 * for before the upload: the image would otherwise be published with empty alt text. A slot the
 * pipeline suggested keeps the description it came with.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LexicalEditor from "@/components/ui/lexical-editor";

jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  ...jest.requireActual("@/stores/workspace/use-workspace-context-store"),
  useCurrentWorkspaceId: () => "w1",
}));

jest.mock("@/lib/api-client", () => ({
  ApiError: jest.requireActual("@/lib/api-client/core").ApiError,
  apiClient: { content: { uploadBlogImage: jest.fn() } },
}));
const upload = jest.requireMock("@/lib/api-client").apiClient.content
  .uploadBlogImage as jest.Mock;

const picture = new File(["png"], "mic.png", { type: "image/png" });

function renderWith(markdown: string) {
  const onChange = jest.fn();
  const { container } = render(
    <LexicalEditor initialValue={markdown} onChange={onChange} />,
  );
  const lastMarkdown = () => onChange.mock.calls.at(-1)?.[0] as string;
  const choose = () =>
    userEvent.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      picture,
    );
  return { lastMarkdown, choose };
}

beforeEach(() => {
  jest.clearAllMocks();
  upload.mockResolvedValue({ public_url: "https://cdn.rext.test/mic.png" });
});

describe("the image slot", () => {
  it("asks for a description before uploading into a slot the person put in", async () => {
    const { lastMarkdown, choose } = renderWith(
      "Intro.\n\n![](rext-placeholder:abc)\n\nEnd.",
    );
    expect(
      screen.getByText("Upload an image here, or remove this slot."),
    ).toBeInTheDocument();

    await choose();
    const dialog = await screen.findByRole("dialog", {
      name: "Describe the image",
    });
    expect(dialog).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
    const add = screen.getByRole("button", { name: "Add image" });
    expect(add).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("Description"),
      "A desk microphone",
    );
    await userEvent.click(add);

    await waitFor(() => expect(upload).toHaveBeenCalledWith("w1", picture));
    await waitFor(() =>
      // The editor writes the description as the image's title too.
      expect(lastMarkdown()).toContain(
        "![A desk microphone](https://cdn.rext.test/mic.png",
      ),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uploads nothing when the description is cancelled", async () => {
    const { choose } = renderWith("![](rext-placeholder:abc)");
    await choose();
    await screen.findByRole("dialog", { name: "Describe the image" });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(upload).not.toHaveBeenCalled();
    expect(
      screen.getByText("Upload an image here, or remove this slot."),
    ).toBeInTheDocument();
  });

  it("uploads straight into a suggested slot, keeping the description it came with", async () => {
    const { lastMarkdown, choose } = renderWith(
      "![A host at a microphone](rext-placeholder:abc)",
    );
    expect(
      screen.getByText(/Suggested image: A host at a microphone/),
    ).toBeInTheDocument();

    await choose();
    await waitFor(() => expect(upload).toHaveBeenCalledWith("w1", picture));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() =>
      expect(lastMarkdown()).toContain(
        "![A host at a microphone](https://cdn.rext.test/mic.png",
      ),
    );
  });
});
