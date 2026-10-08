"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  isSignedOut,
  signInAgain,
  subscribeSignedOut,
} from "@/lib/auth/signed-out";
import { leaveGuardInForce, watchLeaveGuard } from "@/lib/leave-guard";

const TOAST_ID = "signed-out";

/**
 * Says so when the page is still open and its session has ended (revnix/rext-control#858), and
 * holds the way back in. It asks rather than leaves by itself: a form on the page may hold text
 * the person wants to copy first. Put aside, it stays in sight as a notice with the same button,
 * so the page never looks alive again without saying why nothing on it works. It goes by itself
 * if a session is found again (the person signed in from another tab).
 */
export function SignedOutNotice() {
  const signedOut = useSyncExternalStore(
    subscribeSignedOut,
    isSignedOut,
    () => false,
  );
  const [putAside, setPutAside] = useState(false);

  // A session that ends a second time asks again.
  useEffect(() => {
    if (!signedOut) setPutAside(false);
  }, [signedOut]);

  useEffect(() => {
    if (!signedOut || !putAside) return;
    toast.warning("You've been signed out", {
      id: TOAST_ID,
      description: "Nothing on this page can be saved until you sign in again.",
      duration: Number.POSITIVE_INFINITY,
      action: { label: "Sign in again", onClick: signInAgain },
    });
    return () => {
      toast.dismiss(TOAST_ID);
    };
  }, [signedOut, putAside]);

  // Whether a form on the page holds unsaved changes. Watched, not read once: a form lifts its
  // guard while it submits, and the submit is often what meets the session's end.
  const unsaved = useSyncExternalStore(
    watchLeaveGuard,
    leaveGuardInForce,
    () => false,
  );

  return (
    <AlertDialog
      open={signedOut && !putAside}
      onOpenChange={(open) => {
        if (!open) setPutAside(true);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You've been signed out</AlertDialogTitle>
          <AlertDialogDescription>
            {unsaved
              ? "Sign in again to carry on. What you typed on this page won't be kept, so copy anything you need first."
              : "Sign in again to carry on."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay on this page</AlertDialogCancel>
          <AlertDialogAction onClick={signInAgain}>
            Sign in again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
