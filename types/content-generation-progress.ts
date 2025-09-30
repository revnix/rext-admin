export type GenerationStepStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed";

export interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: GenerationStepStatus;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number; // in minutes
  progress?: number; // 0-100 percentage
  error?: string;
}

export interface ContentGenerationProgress {
  id: string;
  status: "queued" | "in-progress" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  estimatedCompletionTime?: string;
  totalEstimatedDuration: number; // in minutes
  currentStep?: string;
  steps: GenerationStep[];
  metadata: {
    topicId: string;
    contentType: string;
    formData: Record<string, unknown>; // Store the original form data
  };
}

export const GENERATION_STEPS = [
  {
    id: "topic-processing",
    title: "Topic Processing",
    description: "Analyzing topic and extracting key insights",
    estimatedDuration: 1,
  },
  {
    id: "research",
    title: "Research",
    description: "Gathering relevant information and sources",
    estimatedDuration: 2,
  },
  {
    id: "content-generation",
    title: "Content Generation",
    description: "Creating the main content based on research",
    estimatedDuration: 3,
  },
  {
    id: "quality-check",
    title: "Quality Check",
    description: "Reviewing content for accuracy and quality",
    estimatedDuration: 1,
  },
  {
    id: "final-review",
    title: "Final Review",
    description: "Final formatting and optimization",
    estimatedDuration: 1,
  },
] as const;

export type GenerationStepId = (typeof GENERATION_STEPS)[number]["id"];
