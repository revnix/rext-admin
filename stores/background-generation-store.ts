"use client";

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export const BACKGROUND_GENERATION_STORAGE_KEY = "rext-background-generations";

export type BackgroundGenerationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface BackgroundGenerationJob {
  threadId: string;
  runId?: string;
  workspaceId?: string;
  workspaceSlug: string;
  title: string;
  keyword: string;
  status: BackgroundGenerationStatus;
  stage: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  resultUrl: string;
  error?: string;
  completionNotified?: boolean;
}

interface BackgroundGenerationStore {
  jobs: BackgroundGenerationJob[];
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  upsertJob: (job: BackgroundGenerationJob) => void;
  updateJob: (
    threadId: string,
    updates: Partial<Omit<BackgroundGenerationJob, "threadId" | "createdAt">>,
  ) => void;
  removeJob: (threadId: string) => void;
  replaceJobs: (jobs: BackgroundGenerationJob[]) => void;
  mergeJobs: (jobs: BackgroundGenerationJob[]) => void;
  pruneFinishedJobs: () => void;
}

const MAX_JOBS = 8;
const FINISHED_JOB_TTL_MS = 24 * 60 * 60 * 1000;

const newestFirst = (
  left: BackgroundGenerationJob,
  right: BackgroundGenerationJob,
) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

const normalizeJobs = (jobs: BackgroundGenerationJob[]) =>
  [...jobs].sort(newestFirst).slice(0, MAX_JOBS);

export const useBackgroundGenerationStore = create<BackgroundGenerationStore>()(
  devtools(
    persist(
      (set) => ({
        jobs: [],
        hasHydrated: false,
        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        upsertJob: (job) =>
          set((state) => {
            const withoutCurrent = state.jobs.filter(
              (item) => item.threadId !== job.threadId,
            );
            return { jobs: normalizeJobs([job, ...withoutCurrent]) };
          }),
        updateJob: (threadId, updates) =>
          set((state) => ({
            jobs: normalizeJobs(
              state.jobs.map((job) =>
                job.threadId === threadId
                  ? {
                      ...job,
                      ...updates,
                      updatedAt: updates.updatedAt ?? new Date().toISOString(),
                    }
                  : job,
              ),
            ),
          })),
        removeJob: (threadId) =>
          set((state) => ({
            jobs: state.jobs.filter((job) => job.threadId !== threadId),
          })),
        replaceJobs: (jobs) =>
          set((state) => {
            const next = normalizeJobs(jobs);
            if (JSON.stringify(next) === JSON.stringify(state.jobs)) {
              return state;
            }
            return { jobs: next };
          }),
        mergeJobs: (jobs) =>
          set((state) => {
            const merged = new Map(
              state.jobs.map((job) => [job.threadId, job]),
            );
            for (const incoming of jobs) {
              const current = merged.get(incoming.threadId);
              if (
                !current ||
                new Date(incoming.updatedAt).getTime() >=
                  new Date(current.updatedAt).getTime()
              ) {
                merged.set(incoming.threadId, incoming);
              }
            }
            return { jobs: normalizeJobs([...merged.values()]) };
          }),
        pruneFinishedJobs: () =>
          set((state) => {
            const cutoff = Date.now() - FINISHED_JOB_TTL_MS;
            return {
              jobs: state.jobs.filter(
                (job) =>
                  job.status === "queued" ||
                  job.status === "running" ||
                  new Date(job.updatedAt).getTime() > cutoff,
              ),
            };
          }),
      }),
      {
        name: BACKGROUND_GENERATION_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ jobs: state.jobs }),
        merge: (persisted, current) => {
          const persistedState =
            persisted as Partial<BackgroundGenerationStore>;
          return {
            ...current,
            ...persistedState,
            jobs: normalizeJobs(persistedState.jobs ?? current.jobs),
          };
        },
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
          state?.pruneFinishedJobs();
        },
      },
    ),
    {
      name: "background-generation-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
