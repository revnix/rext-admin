/**
 * The support chat (Crisp, revnix/rext-control#711), loaded on the first "Chat with us" only:
 * until then no Crisp script, request or cookie touches the page, so it costs ordinary page
 * views nothing and needs no consent. Its own floating launcher stays hidden: our own controls
 * open it (the Chat button, the help menus, the link on the sign-in pages), and the bottom edge
 * belongs to the mobile bar and the generation dock.
 *
 * Someone who has opened it before has a conversation, and a reply may be waiting: for them it
 * is loaded again on their later pages, still closed, so the unread mark shows. Someone who
 * never opened it still loads nothing.
 *
 * The chat is tied to the account by a session token from /api/support-chat/identity (an HMAC
 * of the user id), so a user finds the same conversation on every device, and another user
 * can't take it over by guessing.
 */

const CRISP_SCRIPT = "https://client.crisp.chat/l.js";

type CrispCommand = unknown[];

declare global {
  interface Window {
    $crisp?: {
      push: (command: CrispCommand) => unknown;
      get?: (key: string) => unknown;
    };
    CRISP_WEBSITE_ID?: string;
    CRISP_TOKEN_ID?: string | null;
    CRISP_RUNTIME_CONFIG?: { session_merge?: boolean };
  }
}

interface Identity {
  tokenId: string;
  userId: string;
  email: string | null;
  name: string | null;
  plan?: string | null;
}

/** Whose conversation this browser last opened: the account's id, nothing else. */
const OPENED_KEY = "rext.support-chat.opened";

function openedBy(): string | null {
  try {
    return window.localStorage.getItem(OPENED_KEY);
  } catch {
    return null; // storage is off: nobody is remembered, and nothing loads by itself
  }
}

function rememberOpened(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(OPENED_KEY, userId);
  } catch {
    // storage is off
  }
}

/** The Crisp website the chat opens; unset, there's no chat to offer. env.ts requires it with
 * CRISP_TOKEN_SECRET, so a deploy never offers a chat whose identity route can't answer. */
export function supportChatEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID);
}

let loading: Promise<boolean> | null = null;
// The account the loaded chat belongs to; null for a visitor who hasn't signed in.
let chatUserId: string | null = null;
// The loaded chat is a visitor's: an account's opening has to load its own.
let visitor = false;
const unreadListeners = new Set<(count: number) => void>();

function publishUnread() {
  const count = Number(window.$crisp?.get?.("chat:unread:count") ?? 0) || 0;
  for (const listener of unreadListeners) listener(count);
}
// Whether the chat's box is open on the page: Crisp then shows its own round button to close
// it, in the corner our Chat button sits in.
const openListeners = new Set<(open: boolean) => void>();
let boxOpen = false;

function publishOpen(open: boolean) {
  boxOpen = open;
  for (const listener of openListeners) listener(open);
}
// Crisp's script is on the page (it stays there across an account switch without a reload).
let scriptLoaded = false;
// Bumped by a reset: an identity that arrives after it belongs to the account before.
let generation = 0;

function identify(
  crisp: { push: (command: CrispCommand) => unknown },
  identity: Identity,
) {
  if (identity.email) crisp.push(["set", "user:email", [identity.email]]);
  if (identity.name) crisp.push(["set", "user:nickname", [identity.name]]);
  const data: [string, string][] = [["user_id", identity.userId]];
  if (identity.plan) data.push(["plan", identity.plan]);
  crisp.push(["set", "session:data", [data]]);
}

async function fetchIdentity(started: number): Promise<Identity | null> {
  const response = await fetch("/api/support-chat/identity", {
    cache: "no-store",
  });
  if (!response.ok || started !== generation) return null;
  const identity = (await response.json()) as Identity;
  return started === generation ? identity : null;
}

/** Crisp on the page for `identity`, or for a visitor who hasn't signed in (`null`). Closed. */
async function attach(websiteId: string, identity: Identity | null) {
  chatUserId = identity?.userId ?? null;
  visitor = identity === null;
  if (scriptLoaded && window.$crisp) {
    // Another account in the same page (the invitation switch, or a visitor who then signed
    // in): a token set after Crisp has loaded takes a session reset to apply, as Crisp documents.
    window.CRISP_TOKEN_ID = identity?.tokenId ?? null;
    window.$crisp.push(["do", "session:reset"]);
    if (identity) identify(window.$crisp, identity);
    return;
  }

  // Crisp reads these before its script runs, and plays the queued commands once it has.
  const queue: CrispCommand[] = [];
  window.$crisp = queue;
  window.CRISP_WEBSITE_ID = websiteId;
  window.CRISP_TOKEN_ID = identity?.tokenId ?? null;
  window.CRISP_RUNTIME_CONFIG = { session_merge: true };
  queue.push(["do", "chat:hide"]);
  queue.push([
    "on",
    "chat:closed",
    () => {
      window.$crisp?.push(["do", "chat:hide"]);
      publishOpen(false);
    },
  ]);
  // Crisp keeps one callback per event, the last one registered: each event is registered once.
  // The box opening also means the chat is being read, which changes the unread mark.
  queue.push([
    "on",
    "chat:opened",
    () => {
      publishOpen(true);
      publishUnread();
    },
  ]);
  // A reply that arrives changes the unread mark.
  for (const event of ["session:loaded", "message:received"]) {
    queue.push(["on", event, publishUnread]);
  }
  if (identity) identify(queue, identity);

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CRISP_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("The support chat didn't load"));
    document.head.appendChild(script);
  });
  scriptLoaded = true;
}

async function load(): Promise<boolean> {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  if (!websiteId) return false;
  const identity = await fetchIdentity(generation);
  if (!identity) return false;
  await attach(websiteId, identity);
  return true;
}

/**
 * Opens the chat, loading it the first time; false when it can't (not configured, signed out,
 * an admin impersonating someone, or Crisp unreachable), for the caller to say so.
 */
export async function openSupportChat(): Promise<boolean> {
  if (visitor) loading = null; // the visitor's chat from the sign-in page: load the account's
  if (!loading) {
    loading = load().catch(() => false);
  }
  const ready = await loading;
  if (!ready) {
    loading = null; // a later click tries again
    return false;
  }
  rememberOpened(chatUserId);
  window.$crisp?.push(["do", "chat:show"]);
  window.$crisp?.push(["do", "chat:open"]);
  return true;
}

/**
 * For someone who opened the chat before: loads it again, closed, so a reply's unread mark can
 * show. Our own identity route is asked first; Crisp is loaded only when the signed-in account is
 * the one that opened it. Anyone else loads nothing.
 */
export async function resumeSupportChat(): Promise<boolean> {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  const opened = typeof window === "undefined" ? null : openedBy();
  if (!websiteId || !opened) return false;
  if (visitor) loading = null;
  if (!loading) {
    loading = (async () => {
      const identity = await fetchIdentity(generation);
      if (!identity || identity.userId !== opened) return false;
      await attach(websiteId, identity);
      return true;
    })().catch(() => false);
  }
  const ready = await loading;
  if (!ready) loading = null;
  else publishUnread();
  return ready;
}

/**
 * Opens the chat for a visitor who hasn't signed in (the sign-in pages): no identity, so the
 * conversation is the browser's. Signing in afterwards switches to the account's own.
 */
export async function openVisitorSupportChat(): Promise<boolean> {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  if (!websiteId) return false;
  if (!visitor) loading = null; // an account's chat left on the page: the visitor gets their own
  if (!loading) {
    loading = attach(websiteId, null).then(
      () => true,
      () => false,
    );
  }
  const ready = await loading;
  if (!ready) {
    loading = null;
    return false;
  }
  window.$crisp?.push(["do", "chat:show"]);
  window.$crisp?.push(["do", "chat:open"]);
  return true;
}

/** Calls back with the number of unread replies, whenever it may have changed. */
export function onSupportChatUnread(
  listener: (count: number) => void,
): () => void {
  unreadListeners.add(listener);
  return () => {
    unreadListeners.delete(listener);
  };
}

/** Tells `listener` whether the chat's box is open, now and at every change; returns how to stop. */
export function onSupportChatOpenChange(
  listener: (open: boolean) => void,
): () => void {
  openListeners.add(listener);
  listener(boxOpen);
  return () => {
    openListeners.delete(listener);
  };
}

/** On sign-out or an account switch: the browser's Crisp session ends with the account's. */
export function resetSupportChat(): void {
  // The next opening fetches the next account's identity, and one still in flight is dropped.
  generation += 1;
  loading = null;
  chatUserId = null;
  for (const listener of unreadListeners) listener(0);
  if (typeof window === "undefined" || !window.$crisp) return;
  // Crisp's order: the token is cleared first, or the reset keeps the old conversation.
  window.CRISP_TOKEN_ID = null;
  window.$crisp.push(["do", "session:reset"]);
}
