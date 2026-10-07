/**
 * The support chat loads on its first opening only (revnix/rext-control#711): no Crisp script,
 * request or cookie before "Chat with us", once after it, and nothing when it can't open.
 */

const WEBSITE_ID = "00000000-0000-4000-8000-000000000000";
const IDENTITY = {
  tokenId: "a".repeat(64),
  userId: "u-1",
  email: "ana@example.com",
  name: "Ana",
};

function crispScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll("script")).filter((s) =>
    s.src.startsWith("https://client.crisp.chat/"),
  );
}

/** The browser fires the script's load once it's added. */
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

async function freshModule() {
  jest.resetModules();
  return import("@/lib/support-chat/chat");
}

beforeEach(() => {
  document.head.innerHTML = "";
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

describe("the support chat", () => {
  it("loads nothing until it's opened", async () => {
    await freshModule();
    expect(crispScripts()).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.$crisp).toBeUndefined();
  });

  it("loads Crisp once, with the user's session token and details, then opens", async () => {
    const chat = await freshModule();

    expect(await chat.openSupportChat()).toBe(true);
    expect(await chat.openSupportChat()).toBe(true);

    expect(crispScripts()).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/support-chat/identity", {
      cache: "no-store",
    });
    expect(window.CRISP_WEBSITE_ID).toBe(WEBSITE_ID);
    expect(window.CRISP_TOKEN_ID).toBe(IDENTITY.tokenId);
    const queue = window.$crisp as unknown as unknown[][];
    expect(queue[0]).toEqual(["do", "chat:hide"]); // no floating launcher
    expect(queue).toContainEqual(["set", "user:email", [IDENTITY.email]]);
    expect(queue).toContainEqual(["set", "user:nickname", [IDENTITY.name]]);
    expect(queue).toContainEqual(["do", "chat:open"]);
  });

  it("isn't offered when no Crisp website is set", async () => {
    delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    const chat = await freshModule();

    expect(chat.supportChatEnabled()).toBe(false);
    expect(await chat.openSupportChat()).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads nothing when the identity is refused, and tries again next time", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const chat = await freshModule();

    expect(await chat.openSupportChat()).toBe(false);
    expect(await chat.openSupportChat()).toBe(false);

    expect(crispScripts()).toHaveLength(0);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("ends the browser's chat session on sign-out", async () => {
    const chat = await freshModule();
    await chat.openSupportChat();

    chat.resetSupportChat();

    expect(window.$crisp as unknown as unknown[][]).toContainEqual([
      "do",
      "session:reset",
    ]);
    expect(window.CRISP_TOKEN_ID).toBeNull(); // cleared before the reset, as Crisp asks
  });

  it("after an account switch in the same page, applies the next account's token", async () => {
    const chat = await freshModule();
    await chat.openSupportChat();
    chat.resetSupportChat();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        ...IDENTITY,
        tokenId: "b".repeat(64),
        userId: "u-2",
      }),
    })) as unknown as typeof fetch;

    expect(await chat.openSupportChat()).toBe(true);

    expect(global.fetch).toHaveBeenCalledTimes(1); // the new account's identity
    expect(crispScripts()).toHaveLength(1); // Crisp isn't loaded twice
    expect(window.CRISP_TOKEN_ID).toBe("b".repeat(64));
    const queue = window.$crisp as unknown as unknown[][];
    const resets = queue.filter((c) => c[1] === "session:reset").length;
    expect(resets).toBe(2); // the sign-out's, then the one that applies the new token
    expect(queue).toContainEqual([
      "set",
      "session:data",
      [[["user_id", "u-2"]]],
    ]);
  });

  it("drops an identity that arrives after a reset", async () => {
    let answer: (value: unknown) => void = () => {};
    global.fetch = jest.fn(
      () => new Promise((resolve) => (answer = resolve)),
    ) as unknown as typeof fetch;
    const chat = await freshModule();

    const opening = chat.openSupportChat();
    chat.resetSupportChat(); // the account signs out while its identity is on the way
    answer({ ok: true, json: async () => IDENTITY });

    expect(await opening).toBe(false);
    expect(crispScripts()).toHaveLength(0);
    expect(window.CRISP_TOKEN_ID).toBeUndefined();
  });
});
