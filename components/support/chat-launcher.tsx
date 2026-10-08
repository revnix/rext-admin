"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupportChat } from "@/hooks/use-support-chat";

/** Where the bottom edge is the page's own: the editor's bar, and Generate's working surface. */
const NOT_HERE = [
  /^\/edit(\/|$)/,
  /\/generate-content(\/|$)/,
  /\/content\/[^/]+\/edit$/,
];

/**
 * The Chat button on every signed-in page (task 711): at desktop widths, bottom right, above the
 * generation dock when it shows. It opens the support chat, which loads on that first click only.
 * On a phone the bottom edge is the bar's and the dock's, so the chat stays in Help and the
 * account menu. A dot says a reply hasn't been read. While the chat's box is open the button
 * steps aside: Crisp's own round button to close it takes that corner.
 */
export function ChatLauncher() {
  const chat = useSupportChat();
  const pathname = usePathname() ?? "";
  if (
    !chat.available ||
    chat.isOpen ||
    NOT_HERE.some((route) => route.test(pathname))
  ) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void chat.open()}
      className="fixed right-4 bottom-[calc(var(--dock-height,0px)+--spacing(4))] z-(--z-sticky) hidden lg:inline-flex"
    >
      <MessageCircle aria-hidden />
      Chat
      {chat.unread > 0 && (
        <>
          <span
            aria-hidden
            className="size-2 rounded-full bg-primary"
            data-slot="chat-unread"
          />
          <span className="sr-only">
            {chat.unread === 1
              ? "1 unread reply"
              : `${chat.unread} unread replies`}
          </span>
        </>
      )}
    </Button>
  );
}
