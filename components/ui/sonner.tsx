"use client";

import { useEffect, useRef } from "react";
import { Toaster as Sonner, useSonner } from "sonner";
import { analytics } from "@/lib/analytics";
import { errorToastProperties } from "@/lib/analytics-failures";
import { loadWords, wordsLoaded } from "@/lib/analytics-recording";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Says that an error toast came up (rext-control task 894), once per toast: the one place every
 * toast of the app passes through, so no caller has to remember. What it may say of a toast is
 * decided in lib/analytics-failures.ts: never a sentence that isn't the app's own.
 */
function ErrorToastReport() {
  const { toasts } = useSonner();
  const reported = useRef(new Set<string | number>());

  useEffect(() => {
    // A toast that has gone may come up again under the same name: it is forgotten here.
    const showing = new Set(toasts.map((toast) => toast.id));
    for (const id of reported.current) {
      if (!showing.has(id)) reported.current.delete(id);
    }
    for (const toast of toasts) {
      if (toast.type !== "error" || reported.current.has(toast.id)) continue;
      reported.current.add(toast.id);
      // Sent now, not after a wait: the page, the workspace and the person are the ones the
      // toast came up for only at this moment.
      analytics.track(
        "error_toast_shown",
        errorToastProperties(toast.id, toast.title, window.location.pathname),
      );
      // The app's word list is read for the toasts that follow, where a recording hasn't
      // read it already.
      if (!wordsLoaded()) void loadWords();
    }
  }, [toasts]);

  return null;
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <ErrorToastReport />
      <Sonner
        theme="light"
        className="toaster group z-50"
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:shadow-md border rounded-md p-4",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            success: "!bg-success-50 !border-success-200 !text-success-700",
            error: "!bg-danger-50 !border-danger-200 !text-danger-700",
            // Only error and success carry colour; other notices stay neutral.
            warning: "!bg-card !border-border !text-foreground",
            info: "!bg-card !border-border !text-foreground",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster };
