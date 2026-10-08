"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "unsaved" | "saving" | "failed";

type AutosaveOptions<T> = {
  /** What the server holds when the page opens. */
  initial: T;
  save: (value: T) => Promise<unknown>;
  /** How long after the last change a save starts. */
  delay?: number;
  /** How long after a failed save the next try starts by itself. */
  retryDelay?: number;
};

/**
 * Saves a value by itself (the full-screen article editor, task 706): `delay` ms after the last
 * change, one save at a time, and again after a failure (by itself every `retryDelay` ms, or at once
 * through `saveNow`). A change made while a save is in flight is saved next. `state` is what the page
 * says: "saved", "unsaved" (a change is waiting), "saving", or "failed" (the last try didn't work, and
 * the change is still waiting).
 */
export function useAutosave<T>({
  initial,
  save,
  delay = 2000,
  retryDelay = 15000,
}: AutosaveOptions<T>) {
  const [state, setState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saved = useRef(initial);
  const latest = useRef(initial);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const runRef = useRef<() => Promise<boolean>>(async () => true);
  // The save under way, for a caller that has to wait for it (`saveNow`).
  const running = useRef<Promise<boolean> | null>(null);
  // False once the page is gone: a save still in flight then ends quietly, and nothing is tried
  // again, so an abandoned editor can never write its old text over a newer one.
  const alive = useRef(true);

  /** Starts a save and keeps hold of it while it runs. */
  const start = useCallback(() => {
    const run = runRef.current();
    running.current = run;
    void run.finally(() => {
      if (running.current === run) running.current = null;
    });
    return run;
  }, []);

  const schedule = useCallback(
    (ms: number) => {
      if (timer.current) clearTimeout(timer.current);
      if (!alive.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        void start();
      }, ms);
    },
    [start],
  );

  runRef.current = async () => {
    if (inFlight.current || !alive.current) return false;
    const sending = latest.current;
    if (Object.is(sending, saved.current)) {
      setState("saved");
      return true;
    }
    inFlight.current = true;
    setState("saving");
    try {
      await saveRef.current(sending);
      saved.current = sending;
      inFlight.current = false;
      if (!alive.current) return Object.is(latest.current, sending);
      setSavedAt(new Date());
      if (Object.is(latest.current, sending)) {
        setState("saved");
        return true;
      }
      setState("unsaved");
      schedule(delay);
      return false;
    } catch {
      inFlight.current = false;
      if (!alive.current) return false;
      setState("failed");
      schedule(retryDelay);
      return false;
    }
  };

  /** A change by the person: saved after the delay. */
  const change = useCallback(
    (value: T) => {
      latest.current = value;
      if (Object.is(value, saved.current)) {
        if (!inFlight.current) {
          if (timer.current) clearTimeout(timer.current);
          timer.current = null;
          setState("saved");
        }
        return;
      }
      // A failure stays on show until a save works; the change still restarts the wait.
      setState((current) =>
        current === "saving" || current === "failed" ? current : "unsaved",
      );
      if (!inFlight.current) schedule(delay);
    },
    [delay, schedule],
  );

  /** The editor's own first rewrite of the text (no change by the person): the new baseline. */
  const rebase = useCallback((value: T) => {
    saved.current = value;
    latest.current = value;
  }, []);

  /**
   * Saves at once: "Retry now", or the way out of the page. True when nothing is left unsaved. A
   * save already under way is waited for first, then whatever it left is saved: asked for in the
   * middle of an autosave, it must not answer "not saved" and drop what the person chose to do.
   */
  const saveNow = useCallback(async () => {
    if (running.current) await running.current;
    // The save just ended may have set a timer for what it left: this is that save.
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    return start();
  }, [start]);

  /**
   * Stops saving by itself and hands over what is still unsaved, for an action that takes the
   * unsaved value to the server its own way (a version's restore keeps it as a version). A save
   * under way is waited for first. Null when nothing is unsaved. `resume` lets the saving go on
   * when that action didn't happen.
   */
  const hold = useCallback(async () => {
    if (running.current) await running.current;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    return Object.is(latest.current, saved.current)
      ? null
      : { value: latest.current };
  }, []);

  const resume = useCallback(() => {
    if (!Object.is(latest.current, saved.current) && !inFlight.current) {
      schedule(delay);
    }
  }, [delay, schedule]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  return { state, savedAt, change, rebase, saveNow, hold, resume };
}
