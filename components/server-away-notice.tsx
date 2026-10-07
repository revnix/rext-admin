"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  isServerAway,
  reportServerBack,
  serverAnswers,
  subscribeServerAway,
} from "@/lib/api-client/server-away";

const TOAST_ID = "server-away";
/** How often the watch asks whether the API is back, and how many times before it gives up. */
const WATCH_EVERY_MS = 5000;
const WATCH_TRIES = 36;

/**
 * Says so when the API is away (task 759): a backend deploy restarts it for about a minute, and the
 * API client reports it once a request's retries have run out. One notice, kept until the API
 * answers again; then whatever failed to load meanwhile loads again by itself. After three minutes
 * without an answer the watch stops and the notice goes: the pages' own errors say the rest.
 */
export function ServerAwayNotice() {
  const away = useSyncExternalStore(
    subscribeServerAway,
    isServerAway,
    () => false,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!away) return;
    toast.info("Rext is updating", {
      id: TOAST_ID,
      description: "Back in a minute.",
      duration: Number.POSITIVE_INFINITY,
    });

    let tries = 0;
    let asking = false;
    const timer = window.setInterval(async () => {
      if (asking) return;
      asking = true;
      tries += 1;
      const back = await serverAnswers();
      asking = false;
      if (back) {
        reportServerBack();
        void queryClient.invalidateQueries({
          predicate: (query) => query.state.status === "error",
        });
      } else if (tries >= WATCH_TRIES) {
        reportServerBack();
      }
    }, WATCH_EVERY_MS);

    return () => {
      window.clearInterval(timer);
      toast.dismiss(TOAST_ID);
    };
  }, [away, queryClient]);

  return null;
}
