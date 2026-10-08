/**
 * The support chat beyond its first opening (revnix/rext-control#711): it is loaded again, closed,
 * for the account that opened it before, so a reply's unread mark shows; a visitor on the sign-in
 * pages can open it with no identity; and anyone who never opened it still loads nothing.
 */

import type * as Chat from "@/lib/support-chat/chat";

const WEBSITE_ID = "00000000-0000-4000-8000-000000000000";
const IDENTITY = {
  tokenId: "a".repeat(64),
  userId: "u-1",
  email: "ana@example.com",
  name: "Ana",
  plan: "Growth",
};
const OPENED_KEY = "rext.support-chat.opened";

function crispScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll("script")).filter((s) =>
    s.src.startsWith("https://client.crisp.chat/"),
  );
}

function loadScriptsWhenAdded() {
  const append = document.head.appendChild.bind(document.head);
  jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
    const added = append(node);
    if (node instanceof HTMLScriptElement) {
      queueMicrotask(() => node.dispatchEvent(new Event("load")));
    }
    return added;
  });
}

async function freshModule(): Promise<typeof Chat> {
  jest.resetModules();
  return import("@/lib/support-chat/chat");
}

const queued = () => (window.$crisp as unknown as unknown[][]) ?? [];
const identityCalls = () => (global.fetch as jest.Mock).mock.calls.length;

beforeEach(() => {
  document.head.innerHTML = "";
  window.localStorage.clear();
  delete window.$crisp;
  delete window.CRISP_TOKEN_ID;
  delete window.CRISP_WEBSITE_ID;
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = WEBSITE_ID;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => IDENTITY,
  })) as unknown as typeof fetch;
  loadScriptsWhenAdded();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
});

describe("someone who opened the chat before", () => {
  it("is remembered by their account once they open it", async () => {
    const chat = await freshModule();
    expect(window.localStorage.getItem(OPENED_KEY)).toBeNull();

    await chat.openSupportChat();

    expect(window.localStorage.getItem(OPENED_KEY)).toBe("u-1");
  });

  it("gets the chat loaded again, closed, with their identity and plan", async () => {
    window.localStorage.setItem(OPENED_KEY, "u-1");
    const chat = await freshModule();

    expect(await chat.resumeSupportChat()).toBe(true);

    expect(crispScripts()).toHaveLength(1);
    expect(window.CRISP_TOKEN_ID).toBe(IDENTITY.tokenId);
    expect(queued()).toContainEqual(["do", "chat:hide"]);
    expect(queued()).not.toContainEqual(["do", "chat:open"]);
    expect(queued()).toContainEqual([
      "set",
      "session:data",
      [
        [
          ["user_id", "u-1"],
          ["plan", "Growth"],
        ],
      ],
    ]);
  });

  it("loads nothing for an account that never opened it", async () => {
    const chat = await freshModule();

    expect(await chat.resumeSupportChat()).toBe(false);

    expect(crispScripts()).toHaveLength(0);
    expect(identityCalls()).toBe(0); // not even our own route is asked
  });

  it("loads nothing of Crisp's when another account is signed in on this browser", async () => {
    window.localStorage.setItem(OPENED_KEY, "someone-else");
    const chat = await freshModule();

    expect(await chat.resumeSupportChat()).toBe(false);

    expect(identityCalls()).toBe(1); // our own route says who this is
    expect(crispScripts()).toHaveLength(0);
    expect(window.$crisp).toBeUndefined();
  });

  it("hears when the chat's box opens and closes", async () => {
    const chat = await freshModule();
    const heard: boolean[] = [];
    const stop = chat.onSupportChatOpenChange((open) => heard.push(open));
    expect(heard).toEqual([false]); // told at once: closed

    await chat.openSupportChat();
    const listeners = queued().filter((command) => command[0] === "on");
    const on = (event: string) =>
      (listeners.find((c) => c[1] === event) as unknown[])[2] as () => void;
    window.$crisp = { push: jest.fn(), get: () => 0 };
    on("chat:opened")();
    expect(heard.at(-1)).toBe(true);

    on("chat:closed")();
    expect(heard.at(-1)).toBe(false);
    expect(window.$crisp.push).toHaveBeenCalledWith(["do", "chat:hide"]);

    stop();
    on("chat:opened")();
    expect(heard.at(-1)).toBe(false); // no longer listening
  });

  it("hears how many replies are unread, and nothing after a reset", async () => {
    window.localStorage.setItem(OPENED_KEY, "u-1");
    const chat = await freshModule();
    const heard: number[] = [];
    const stop = chat.onSupportChatUnread((count) => heard.push(count));
    await chat.resumeSupportChat();

    // Crisp, loaded: it answers the count, and fires the events the loader listens to.
    const listeners = queued().filter((command) => command[0] === "on");
    window.$crisp = { push: jest.fn(), get: () => 2 };
    const received = listeners.find(
      (c) => c[1] === "message:received",
    ) as unknown[];
    const reply = received[2] as () => void;
    reply();
    expect(heard.at(-1)).toBe(2);

    chat.resetSupportChat();
    expect(heard.at(-1)).toBe(0);

    stop();
    reply();
    expect(heard.at(-1)).toBe(0); // no longer listening
  });
});

describe("a visitor on the sign-in pages", () => {
  it("opens the chat with no identity and no call to the identity route", async () => {
    const chat = await freshModule();

    expect(await chat.openVisitorSupportChat()).toBe(true);

    expect(identityCalls()).toBe(0);
    expect(crispScripts()).toHaveLength(1);
    expect(window.CRISP_WEBSITE_ID).toBe(WEBSITE_ID);
    expect(window.CRISP_TOKEN_ID).toBeNull();
    expect(queued().some((command) => command[0] === "set")).toBe(false);
    expect(queued()).toContainEqual(["do", "chat:open"]);
    expect(window.localStorage.getItem(OPENED_KEY)).toBeNull();
  });

  it("gets their account's conversation once they sign in and open it", async () => {
    const chat = await freshModule();
    await chat.openVisitorSupportChat();
    const crisp = { push: jest.fn(), get: () => 0 };
    window.$crisp = crisp; // Crisp's script has replaced the queue

    expect(await chat.openSupportChat()).toBe(true);

    expect(identityCalls()).toBe(1);
    expect(window.CRISP_TOKEN_ID).toBe(IDENTITY.tokenId);
    expect(crisp.push).toHaveBeenCalledWith(["do", "session:reset"]);
    expect(crisp.push).toHaveBeenCalledWith([
      "set",
      "user:email",
      ["ana@example.com"],
    ]);
    expect(crispScripts()).toHaveLength(1); // the script is not added twice
  });

  it("is offered nothing when the chat isn't configured", async () => {
    delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    const chat = await freshModule();

    expect(await chat.openVisitorSupportChat()).toBe(false);
    expect(crispScripts()).toHaveLength(0);
  });
});
