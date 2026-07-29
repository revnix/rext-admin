import type { BackgroundGenerationJob } from "@/stores/background-generation-store";

export const isActiveGenerationJob = (job: BackgroundGenerationJob) =>
  job.status === "queued" ||
  job.status === "running" ||
  (job.status === "completed" && job.awaitingInput === true);

export const findActiveGenerationJob = (
  jobs: BackgroundGenerationJob[],
): BackgroundGenerationJob | undefined =>
  jobs.filter(isActiveGenerationJob).sort((left, right) => {
    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  })[0];
