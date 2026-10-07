"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageToken } from "@/lib/generate-content/run-events";
import {
  EMPTY_FINDINGS,
  type FindingsEvent,
  OUTLINE_MODEL_NODE,
  type RunFindings,
  reduceFindings,
  TITLE_MODEL_NODE,
} from "@/lib/generate-content/run-findings";
import {
  failStages,
  finishNode,
  type RunPhase,
  type RunStage,
  settleStages,
  stagesAt,
  startStages,
  TITLES_WRITTEN,
} from "@/lib/generate-content/run-stages";
import { recordStageMs } from "@/lib/generate-content/run-timings";

export interface RunStagesState {
  phase: RunPhase;
  stages: RunStage[];
  /** False for a run picked up mid-way (a reload, the dock): its clock started late. */
  learn: boolean;
}

interface State {
  run: RunStagesState | null;
  /** What the thread's runs have found (run-findings.ts); kept across phases, cleared by a new keyword. */
  findings: RunFindings;
}

/** The phase's model whose streamed text is read, and so cleared when the phase starts again. */
const PHASE_TEXT: Partial<Record<RunPhase, string>> = {
  titles: TITLE_MODEL_NODE,
  outline: OUTLINE_MODEL_NODE,
};

/**
 * The stages of the run on screen, moved by the stream: `start` when a phase begins, `nodeDone`
 * for each node an update names, `settle` at a gate or the end, `fail` when it stops. Each stage
 * of a run watched from its start that completes is remembered for the next run's "about" times.
 *
 * Beside them, what the run found (rext-control#694): `nodeDone` reads the update it is given,
 * `token` the title and outline models' text, `custom` the article's searches, and `seed` a thread's
 * saved state when a run is picked up mid-way. The end of the title model's text ends "Writing five
 * titles".
 */
export function useRunStages() {
  const [state, setState] = useState<State>({
    run: null,
    findings: EMPTY_FINDINGS,
  });
  const recorded = useRef(new Set<string>());
  // The models' text so far, by node: kept out of state, so the page is not rendered for each token
  // that changes nothing on screen (most of an outline's are a description's words).
  const texts = useRef<Record<string, string>>({});

  const apply = useCallback((event: FindingsEvent) => {
    setState((current) => {
      const findings = reduceFindings(current.findings, event);
      if (findings === current.findings) return current;
      let { run } = current;
      if (
        run?.phase === "titles" &&
        findings.draftsDone &&
        !current.findings.draftsDone
      ) {
        run = {
          ...run,
          stages: finishNode(run.phase, run.stages, TITLES_WRITTEN, Date.now()),
        };
      }
      return { run, findings };
    });
  }, []);

  // A run picked up mid-way (`joined`) may start at the stage it is in (`at`); its findings come
  // from `seed`.
  const start = useCallback(
    (
      phase: RunPhase,
      { joined = false, at }: { joined?: boolean; at?: string } = {},
    ) => {
      const now = Date.now();
      if (!joined) {
        if (phase === "analysis") texts.current = {};
        const node = PHASE_TEXT[phase];
        if (node) delete texts.current[node];
      }
      setState((current) => ({
        run: {
          phase,
          stages: at ? stagesAt(phase, at, now) : startStages(phase, now),
          learn: !joined,
        },
        findings: joined
          ? current.findings
          : reduceFindings(current.findings, { type: "phase", phase }),
      }));
    },
    [],
  );

  /** A node finished; `data` is its update, read for what it found. */
  const nodeDone = useCallback((node: string, data?: unknown) => {
    // A model's text ends with its node: what it writes next (a regenerated outline) is new text.
    if (node === TITLE_MODEL_NODE || node === OUTLINE_MODEL_NODE) {
      delete texts.current[node];
    }
    setState((current) => {
      if (!current.run && data === undefined) return current;
      return {
        run: current.run
          ? {
              ...current.run,
              stages: finishNode(
                current.run.phase,
                current.run.stages,
                node,
                Date.now(),
              ),
            }
          : current.run,
        findings:
          data === undefined
            ? current.findings
            : reduceFindings(current.findings, { type: "update", node, data }),
      };
    });
  }, []);

  /** A model token (`readMessageToken`): the title and outline models' are read as they write. */
  const token = useCallback(
    ({ token: piece, node }: MessageToken) => {
      if (
        !piece ||
        (node !== TITLE_MODEL_NODE && node !== OUTLINE_MODEL_NODE)
      ) {
        return;
      }
      const text = (texts.current[node] ?? "") + piece;
      texts.current[node] = text;
      apply({ type: "text", node, text });
    },
    [apply],
  );

  /** A `custom` stream event's data: the article's searches are read, its tokens passed over. */
  const custom = useCallback(
    (data: unknown) => {
      const type = (data as { type?: unknown } | null)?.type;
      if (type === "tool_start" || type === "tool_end") {
        apply({ type: "custom", data });
      }
    },
    [apply],
  );

  /**
   * What a thread's saved state shows was found, for a run picked up mid-way at `at` (the status
   * route's `runStage`); `null` clears the findings, for a run being opened.
   */
  const seed = useCallback(
    (threadState: unknown, at?: { phase: RunPhase; id: string }) => {
      texts.current = {};
      setState((current) => ({
        ...current,
        findings:
          threadState === null
            ? EMPTY_FINDINGS
            : reduceFindings(current.findings, {
                type: "seed",
                state: threadState,
                at,
              }),
      }));
    },
    [],
  );

  const settle = useCallback(() => {
    setState((current) =>
      current.run
        ? {
            ...current,
            run: {
              ...current.run,
              stages: settleStages(current.run.stages, Date.now()),
            },
          }
        : current,
    );
  }, []);

  const fail = useCallback(() => {
    setState((current) =>
      current.run
        ? {
            ...current,
            run: {
              ...current.run,
              stages: failStages(current.run.stages, Date.now()),
            },
          }
        : current,
    );
  }, []);

  const clear = useCallback(
    () =>
      setState((current) =>
        current.run ? { ...current, run: null } : current,
      ),
    [],
  );

  const { run, findings } = state;

  // Outside the state updaters, which React may run twice: each completed stage is recorded once.
  useEffect(() => {
    if (!run?.learn) return;
    for (const stage of run.stages) {
      if (stage.state !== "complete" || !stage.startedAt || !stage.endedAt) {
        continue;
      }
      const key = `${stage.id}:${stage.startedAt}`;
      if (recorded.current.has(key)) continue;
      recorded.current.add(key);
      recordStageMs(stage.id, stage.endedAt - stage.startedAt);
    }
  }, [run]);

  return {
    run,
    findings,
    start,
    nodeDone,
    token,
    custom,
    seed,
    settle,
    fail,
    clear,
  };
}
