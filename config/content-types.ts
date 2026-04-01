import {
  FileText,
  BookOpen,
  Zap,
  Target,
  HelpCircle,
  MessageSquare,
  Search,
  Newspaper,
  Layout,
  BarChart3,
  FileCheck2,
  Home,
  Package,
  Sparkles,
  User,
  LogIn,
  UserPlus,
} from "lucide-react";

type ContentTypeRule = {
  match: string[];
  icon: React.ElementType;
  description: string;
};

const DEFAULT_DESCRIPTION =
  "High-quality content optimized for engagement and conversion.";

const CONTENT_TYPE_RULES: ContentTypeRule[] = [
  {
    match: ["homepage"],
    icon: Home,
    description:
      "A compelling landing page introducing your brand and guiding visitors toward key actions.",
  },
  {
    match: ["brand page"],
    icon: Sparkles,
    description:
      "Showcases your brand identity, positioning, and values to build recognition and trust.",
  },
  {
    match: ["product page"],
    icon: Package,
    description:
      "Highlights product features, benefits, and value to help users make purchasing decisions.",
  },
  {
    match: ["feature page"],
    icon: Layout,
    description:
      "Explains specific product capabilities and how they solve real customer problems.",
  },
  {
    match: ["documentation page"],
    icon: BookOpen,
    description:
      "Structured technical documentation that helps users understand and implement your product.",
  },
  {
    match: ["support page"],
    icon: HelpCircle,
    description:
      "Provides troubleshooting guidance and resources for users needing assistance.",
  },
  {
    match: ["contact page"],
    icon: MessageSquare,
    description:
      "Offers visitors clear ways to reach your team for inquiries or support.",
  },
  {
    match: ["about page"],
    icon: User,
    description:
      "Tells the story of your company, mission, and team to build trust with visitors.",
  },
  {
    match: ["login page"],
    icon: LogIn,
    description:
      "Secure entry point where existing users authenticate to access their accounts.",
  },
  {
    match: ["signup page"],
    icon: UserPlus,
    description:
      "Encourages new users to create accounts and begin using your platform.",
  },

  {
    match: ["blog"],
    icon: Newspaper,
    description:
      "Insightful long-form content designed to educate and engage readers.",
  },
  {
    match: ["article"],
    icon: FileText,
    description:
      "Professional editorial content focused on delivering informative insights.",
  },
  {
    match: ["report"],
    icon: BarChart3,
    description:
      "Research-driven content presenting data, analysis, and key findings.",
  },
  {
    match: ["whitepaper"],
    icon: FileCheck2,
    description:
      "In-depth authoritative documentation explaining complex topics or strategies.",
  },
  {
    match: ["guide", "educational"],
    icon: BookOpen,
    description:
      "Step-by-step educational content designed to teach or explain a process.",
  },
  {
    match: ["expert", "opinion"],
    icon: Zap,
    description:
      "Thought leadership and professional insights sharing expert perspectives.",
  },
  {
    match: ["how-to", "tutorial"],
    icon: Layout,
    description:
      "Practical instructions helping readers accomplish specific tasks.",
  },
  {
    match: ["case study"],
    icon: Target,
    description:
      "Real-world examples demonstrating strategies, results, and success stories.",
  },
  {
    match: ["review"],
    icon: Search,
    description:
      "Detailed evaluation of products or services with insights and recommendations.",
  },
  {
    match: ["faq"],
    icon: HelpCircle,
    description:
      "Quick answers to commonly asked questions to help users find solutions faster.",
  },
  {
    match: ["interview"],
    icon: MessageSquare,
    description:
      "Conversations with experts sharing insights, experiences, and industry knowledge.",
  },
];

function normalizeType(type: string) {
  return type.toLowerCase().replace(/[-_]/g, " ").trim();
}

export function getContentTypeConfig(type: string) {
  const normalized = normalizeType(type);

  const rule = CONTENT_TYPE_RULES.find((r) =>
    r.match.some((keyword) => normalized.includes(keyword))
  );

  return (
    rule ?? {
      icon: FileText,
      description: DEFAULT_DESCRIPTION,
    }
  );
}