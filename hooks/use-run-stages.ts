"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  failStages,
  finishNode,
  type RunPhase,
  type RunStage,
  settleStages,
  stagesAt,
  startStages,
} from "@/lib/generate-content/run-stages";
import { recordStageMs } from "@/lib/generate-content/run-timings";

export interface RunStagesState {
  phase: RunPhase;
  stages: RunStage[];
  /** False for a run picked up mid-way (a reload, the dock): its clock started late. */
  learn: boolean;
}

/**
 * The stages of the run on screen, moved by the stream: `start` when a phase begins, `nodeDone`
 * for each node an update names, `settle` at a gate or the end, `fail` when it stops. Each stage
 * of a run watched from its start that completes is remembered for the next run's "about" times.
 */
export function useRunStages() {
  const [run, setRun] = useState<RunStagesState | null>(null);
  const recorded = useRef(new Set<string>());

  // A run picked up mid-way (`joined`) may start at the stage it is in (`at`).
  const start = useCallback(
    (
      phase: RunPhase,
      { joined = false, at }: { joined?: boolean; at?: string } = {},
    ) => {
      const now = Date.now();
      setRun({
        phase,
        stages: at ? stagesAt(phase, at, now) : startStages(phase, now),
        learn: !joined,
      });
    },
    [],
  );

  const nodeDone = useCallback((node: string) => {
    setRun((current) =>
      current
        ? {
            ...current,
            stages: finishNode(current.phase, current.stages, node, Date.now()),
          }
        : current,
    );
  }, []);

  const settle = useCallback(() => {
    setRun((current) =>
      current
        ? { ...current, stages: settleStages(current.stages, Date.now()) }
        : current,
    );
  }, []);

  const fail = useCallback(() => {
    setRun((current) =>
      current
        ? { ...current, stages: failStages(current.stages, Date.now()) }
        : current,
    );
  }, []);

  const clear = useCallback(() => setRun(null), []);

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

  return { run, start, nodeDone, settle, fail, clear };
}
