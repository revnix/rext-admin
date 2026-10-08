"use client";

import { toast } from "sonner";
import {
  openVisitorSupportChat,
  supportChatEnabled,
} from "@/lib/support-chat/chat";

/**
 * "Chat with us" on the pages before sign-in (task 711): someone who can't get in is who most needs
 * a person. It opens the support chat with no identity; nothing of the chat loads before the click.
 */
export function VisitorChatLink() {
  if (!supportChatEnabled()) return null;

  const open = async () => {
    if (await openVisitorSupportChat()) return;
    toast.error("The chat couldn't open", {
      description: "Try again in a moment.",
    });
  };

  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Need a hand?{" "}
      <button
        type="button"
        onClick={() => void open()}
        className="font-medium text-foreground underline underline-offset-4"
      >
        Chat with us
      </button>
    </p>
  );
}
