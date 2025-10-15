/**
 * Onboarding types for WREXT platform
 */

export interface OnboardingStatus {
  id: string;
  user_id: string;
  completed: boolean;
  current_step: number;
  completed_steps: number[];
  skipped_steps: number[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStepUpdate {
  step: number;
  action: "complete" | "skip" | "set_current";
}

export interface OnboardingReset {
  confirm: boolean;
}

export interface OnboardingStep {
  id: number;
  name: string;
  title: string;
  description: string;
  required: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 0,
    name: "welcome",
    title: "Welcome to WREXT",
    description: "Learn what WREXT can do for you",
    required: true,
  },
  {
    id: 1,
    name: "create_workspace",
    title: "Create Your First Workspace",
    description: "Set up a workspace for your team",
    required: true,
  },
  {
    id: 2,
    name: "invite_team",
    title: "Invite Your Team",
    description: "Add team members to collaborate",
    required: false,
  },
  {
    id: 3,
    name: "upload_knowledge",
    title: "Upload Knowledge Base",
    description: "Add your first knowledge base",
    required: false,
  },
  {
    id: 4,
    name: "generate_content",
    title: "Generate Content",
    description: "Create your first AI-generated content",
    required: false,
  },
  {
    id: 5,
    name: "complete",
    title: "You're All Set!",
    description: "Explore WREXT and start creating",
    required: true,
  },
];
