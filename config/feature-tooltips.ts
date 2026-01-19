/**
 * Feature Tooltips Configuration
 *
 * Defines tooltips for key features throughout the application
 */

export interface FeatureTooltip {
  id: string;
  selector: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  page?: string; // Optional: specific page where tooltip appears
}

export const FEATURE_TOOLTIPS: FeatureTooltip[] = [
  // Dashboard tooltips
  {
    id: "workspace-switcher",
    selector: "[data-tooltip='workspace-switcher']",
    title: "Workspace Switcher",
    content:
      "Switch between your workspaces or create a new one. Each workspace has its own content, knowledge bases, and team members.",
    placement: "bottom",
    page: "/",
  },
  {
    id: "create-workspace",
    selector: "[data-tooltip='create-workspace']",
    title: "Create Workspace",
    content:
      "Create a new workspace to organize your content projects. Workspaces help you separate different brands, clients, or content areas.",
    placement: "right",
    page: "/w",
  },

  // Workspace Overview tooltips
  {
    id: "knowledge-base",
    selector: "[data-tooltip='knowledge-base']",
    title: "Knowledge Base",
    content:
      "Upload files, add URLs, or paste text to build your knowledge base. REXT will use this information to generate accurate, on-brand content.",
    placement: "top",
    page: "/overview",
  },
  {
    id: "topic-generation",
    selector: "[data-tooltip='topic-generation']",
    title: "Topic Generation",
    content:
      "Generate content topics based on your knowledge base. REXT analyzes your content and suggests relevant topics for your audience.",
    placement: "top",
    page: "/overview",
  },
  {
    id: "content-generation",
    selector: "[data-tooltip='content-generation']",
    title: "Content Generation",
    content:
      "Create AI-powered content from your topics. Choose the format, tone, and style to match your brand voice.",
    placement: "top",
    page: "/overview",
  },

  // Knowledge Base tooltips
  {
    id: "add-knowledge",
    selector: "[data-tooltip='add-knowledge']",
    title: "Add Knowledge",
    content:
      "Add knowledge from multiple sources: upload documents (PDF, DOCX, TXT), scrape websites, or paste text directly.",
    placement: "left",
    page: "/knowledge",
  },
  {
    id: "knowledge-filters",
    selector: "[data-tooltip='knowledge-filters']",
    title: "Filter Knowledge",
    content:
      "Filter your knowledge by type (web, file, text), status, or search by name. Keep your knowledge organized and easy to find.",
    placement: "bottom",
    page: "/knowledge",
  },

  // Topics tooltips
  {
    id: "create-topic",
    selector: "[data-tooltip='create-topic']",
    title: "Create Topic",
    content:
      "Generate topic ideas based on your knowledge base. Topics help you plan your content strategy and maintain consistency.",
    placement: "left",
    page: "/topics",
  },
  {
    id: "topic-analytics",
    selector: "[data-tooltip='topic-analytics']",
    title: "Topic Analytics",
    content:
      "Track how your topics perform: views, content generated, and engagement metrics. Use insights to refine your content strategy.",
    placement: "top",
    page: "/topics",
  },

  // Content tooltips
  {
    id: "content-editor",
    selector: "[data-tooltip='content-editor']",
    title: "Content Editor",
    content:
      "Edit your AI-generated content using our rich text editor. Format text, add media, and preview how it will look to your audience.",
    placement: "top",
    page: "/content",
  },
  {
    id: "content-status",
    selector: "[data-tooltip='content-status']",
    title: "Content Status",
    content:
      "Track content through your workflow: Draft → Review → Published. Change status to organize your content pipeline.",
    placement: "left",
    page: "/content",
  },
  {
    id: "publish-content",
    selector: "[data-tooltip='publish-content']",
    title: "Publish Content",
    content:
      "Publish your content directly or export it to your favorite platforms. Schedule posts or save as drafts for later.",
    placement: "bottom",
    page: "/content",
  },

  // Settings tooltips
  {
    id: "brand-voice",
    selector: "[data-tooltip='brand-voice']",
    title: "Brand Voice",
    content:
      "Define your brand's unique voice and tone. REXT will use these guidelines to ensure all generated content matches your brand personality.",
    placement: "right",
    page: "/settings",
  },
  {
    id: "team-management",
    selector: "[data-tooltip='team-management']",
    title: "Team Management",
    content:
      "Invite team members and assign roles (Admin, Editor, Viewer). Control who can create, edit, and publish content in your workspace.",
    placement: "right",
    page: "/w/[slug]/members",
  },
  {
    id: "integrations",
    selector: "[data-tooltip='integrations']",
    title: "Integrations",
    content:
      "Connect REXT with your favorite tools: WordPress, Medium, Ghost, and more. Publish content directly to your platforms.",
    placement: "left",
    page: "/settings/integrations",
  },

  // Subscription tooltips
  {
    id: "usage-meter",
    selector: "[data-tooltip='usage-meter']",
    title: "Usage Tracking",
    content:
      "Monitor your plan usage: content generations, storage, and API calls. Upgrade your plan if you need more resources.",
    placement: "top",
    page: "/settings/billing",
  },
  {
    id: "upgrade-plan",
    selector: "[data-tooltip='upgrade-plan']",
    title: "Upgrade Plan",
    content:
      "Upgrade to unlock more features, higher limits, and priority support. Choose the plan that fits your content needs.",
    placement: "left",
    page: "/settings/subscription",
  },
];

/**
 * Get tooltips for a specific page
 */
export function getTooltipsForPage(pathname: string): FeatureTooltip[] {
  return FEATURE_TOOLTIPS.filter((tooltip) => {
    if (!tooltip.page) return true;
    return pathname.includes(tooltip.page);
  });
}

/**
 * Get tooltip by ID
 */
export function getTooltipById(id: string): FeatureTooltip | undefined {
  return FEATURE_TOOLTIPS.find((tooltip) => tooltip.id === id);
}
