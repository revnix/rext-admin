/**
 * The support chat (Crisp, revnix/rext-control#711), loaded on the first "Chat with us" only:
 * until then no Crisp script, request or cookie touches the page, so it costs ordinary page
 * views nothing and needs no consent. Its own floating launcher stays hidden: the help menus
 * open it, and the bottom edge belongs to the mobile bar and the generation dock.
 *
 * The chat is tied to the account by a session token from /api/support-chat/identity (an HMAC
 * of the user id), so a user finds the same conversation on every device, and another user
 * can't take it over by guessing.
 */

const CRISP_SCRIPT = "https://client.crisp.chat/l.js";

type CrispCommand = unknown[];

declare global {
  interface Window {
    $crisp?: { push: (command: CrispCommand) => unknown };
    CRISP_WEBSITE_ID?: string;
    CRISP_TOKEN_ID?: string;
    CRISP_RUNTIME_CONFIG?: { session_merge?: boolean };
  }
}

interface Identity {
  tokenId: string;
  userId: string;
  email: string | null;
  name: string | null;
}

/** The Crisp website the chat opens; unset, there's no chat to offer. */
export function supportChatEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID);
}

let loading: Promise<boolean> | null = null;

async function load(): Promise<boolean> {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  if (!websiteId) return false;
  const response = await fetch("/api/support-chat/identity", {
    cache: "no-store",
  });
  if (!response.ok) return false;
  const identity = (await response.json()) as Identity;

  // Crisp reads these before its script runs, and plays the queued commands once it has.
  const queue: CrispCommand[] = [];
  window.$crisp = queue;
  window.CRISP_WEBSITE_ID = websiteId;
  window.CRISP_TOKEN_ID = identity.tokenId;
  window.CRISP_RUNTIME_CONFIG = { session_merge: true };
  queue.push(["do", "chat:hide"]);
  queue.push([
    "on",
    "chat:closed",
    () => window.$crisp?.push(["do", "chat:hide"]),
  ]);
  if (identity.email) queue.push(["set", "user:email", [identity.email]]);
  if (identity.name) queue.push(["set", "user:nickname", [identity.name]]);
  queue.push(["set", "session:data", [[["user_id", identity.userId]]]]);

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CRISP_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("The support chat didn't load"));
    document.head.appendChild(script);
  });
  return true;
}

/**
 * Opens the chat, loading it the first time; false when it can't (not configured, signed out,
 * an admin impersonating someone, or Crisp unreachable), for the caller to say so.
 */
export async function openSupportChat(): Promise<boolean> {
  if (!loading) {
    loading = load().catch(() => false);
  }
  const ready = await loading;
  if (!ready) {
    loading = null; // a later click tries again
    return false;
  }
  window.$crisp?.push(["do", "chat:show"]);
  window.$crisp?.push(["do", "chat:open"]);
  return true;
}

/** On sign-out: the browser's Crisp session ends with the account's (the page then reloads). */
export function resetSupportChat(): void {
  if (typeof window === "undefined" || !window.$crisp) return;
  window.$crisp.push(["do", "session:reset"]);
  window.CRISP_TOKEN_ID = undefined;
}
