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

  // Marketing data
  user_industry: string | null;
  user_role: string | null;
  user_goal: string | null;
  heard_from: string | null;

  // Invitation tracking (for invited users)
  via_invitation?: boolean;
  invitation_workspace_id?: string;
  invitation_accepted_at?: string;

  // Timestamps
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStepUpdate {
  step: number;
  action: "complete" | "skip" | "set_current";
}

export interface OnboardingMarketingData {
  user_industry?: string | null;
  user_role?: string | null;
  user_goal?: string | null;
  heard_from?: string | null;
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
    name: "content_strategy",
    title: "Welcome to Wrext",
    description: "Choose your content strategy foundation",
    required: true,
  },
  {
    id: 1,
    name: "marketing_questions",
    title: "Tell Us About Yourself",
    description: "Help us personalize your experience",
    required: true,
  },
  {
    id: 2,
    name: "complete",
    title: "You're All Set!",
    description: "Start creating amazing content",
    required: true,
  },
];

// Marketing question options
export const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology & Software", icon: "💻" },
  { value: "marketing", label: "Marketing & Advertising", icon: "📢" },
  { value: "ecommerce", label: "E-commerce & Retail", icon: "🛍️" },
  { value: "healthcare", label: "Healthcare & Medical", icon: "🏥" },
  { value: "education", label: "Education & Training", icon: "📚" },
  { value: "finance", label: "Finance & Banking", icon: "💰" },
  { value: "media", label: "Media & Publishing", icon: "📰" },
  { value: "consulting", label: "Consulting & Services", icon: "💼" },
  { value: "nonprofit", label: "Non-profit & NGO", icon: "🤝" },
  { value: "other", label: "Other", icon: "🔧" },
];

export const ROLE_OPTIONS = [
  { value: "founder", label: "Founder / CEO", icon: "🚀" },
  { value: "marketing", label: "Marketing Manager", icon: "📊" },
  { value: "content", label: "Content Creator", icon: "✍️" },
  { value: "sales", label: "Sales Professional", icon: "💼" },
  { value: "developer", label: "Developer / Engineer", icon: "👨‍💻" },
  { value: "designer", label: "Designer", icon: "🎨" },
  { value: "consultant", label: "Consultant", icon: "💡" },
  { value: "student", label: "Student / Learner", icon: "🎓" },
  { value: "other", label: "Other", icon: "👤" },
];

export const GOAL_OPTIONS = [
  {
    value: "scale_content",
    label: "Scale content production",
    description: "Create more content faster with AI assistance",
    icon: "📈",
  },
  {
    value: "improve_quality",
    label: "Improve content quality",
    description: "Generate better, more engaging content",
    icon: "⭐",
  },
  {
    value: "save_time",
    label: "Save time on writing",
    description: "Reduce time spent on content creation",
    icon: "⏱️",
  },
  {
    value: "team_collaboration",
    label: "Enable team collaboration",
    description: "Work together on content projects",
    icon: "👥",
  },
  {
    value: "consistency",
    label: "Maintain brand consistency",
    description: "Keep messaging aligned across all content",
    icon: "🎯",
  },
  {
    value: "explore",
    label: "Just exploring",
    description: "Curious to see what WREXT can do",
    icon: "🔍",
  },
];

export const HEARD_FROM_OPTIONS = [
  { value: "search", label: "Search Engine (Google, Bing)", icon: "🔍" },
  { value: "social", label: "Social Media", icon: "📱" },
  { value: "friend", label: "Friend or Colleague", icon: "👥" },
  { value: "blog", label: "Blog or Article", icon: "📝" },
  { value: "youtube", label: "YouTube or Video", icon: "📺" },
  { value: "podcast", label: "Podcast", icon: "🎙️" },
  { value: "ad", label: "Advertisement", icon: "📢" },
  { value: "review", label: "Review Site", icon: "⭐" },
  { value: "other", label: "Other", icon: "💬" },
];
