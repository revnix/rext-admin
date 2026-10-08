import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Where the support chat is offered (task 711): the Chat button on signed-in pages, and the link on
// the pages before sign-in.

const open = jest.fn();
const openVisitor = jest.fn(async () => true);
let chat = { available: true, open, unread: 0 };
let pathname = "/w/acme/content";

jest.mock("@/hooks/use-support-chat", () => ({
  useSupportChat: () => chat,
}));
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));
jest.mock("@/lib/support-chat/chat", () => ({
  supportChatEnabled: () => Boolean(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID),
  openVisitorSupportChat: () => openVisitor(),
}));

import { ChatLauncher } from "@/components/support/chat-launcher";
import { VisitorChatLink } from "@/components/support/visitor-chat-link";

beforeEach(() => {
  open.mockReset();
  openVisitor.mockClear();
  chat = { available: true, open, unread: 0 };
  pathname = "/w/acme/content";
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID =
    "00000000-0000-4000-8000-000000000000";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
});

describe("the Chat button", () => {
  it("opens the chat", async () => {
    render(<ChatLauncher />);

    await userEvent.click(screen.getByRole("button", { name: "Chat" }));

    expect(open).toHaveBeenCalledTimes(1);
  });

  it("is a desktop control: hidden under 1024 px, above the dock", () => {
    render(<ChatLauncher />);

    const button = screen.getByRole("button", { name: "Chat" });
    expect(button).toHaveClass("hidden", "lg:inline-flex", "fixed");
    expect(button.className).toContain("--dock-height");
  });

  it("says a reply is unread", () => {
    chat = { available: true, open, unread: 2 };
    render(<ChatLauncher />);

    expect(
      screen.getByRole("button", { name: "Chat 2 unread replies" }),
    ).toBeInTheDocument();
  });

  it.each([
    "/edit/abc",
    "/w/acme/generate-content",
    "/w/acme/content/123/edit",
  ])("leaves the bottom edge to the page on %s", (path) => {
    pathname = path;
    const { container } = render(<ChatLauncher />);

    expect(container).toBeEmptyDOMElement();
  });

  it("is not shown where the chat isn't offered", () => {
    chat = { available: false, open, unread: 0 };
    const { container } = render(<ChatLauncher />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("the link on the pages before sign-in", () => {
  it("opens the chat for a visitor", async () => {
    render(<VisitorChatLink />);

    await userEvent.click(screen.getByRole("button", { name: "Chat with us" }));

    expect(openVisitor).toHaveBeenCalledTimes(1);
  });

  it("is not shown when the chat isn't configured", () => {
    delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    const { container } = render(<VisitorChatLink />);

    expect(container).toBeEmptyDOMElement();
  });
});
