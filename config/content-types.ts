import {
  FileText,
  BookOpen,
  Target,
  HelpCircle,
  MessageSquare,
  Search,
  Newspaper,
  Layout,
  FileCheck2,
  Home,
  Package,
  Sparkles,
  User,
  LogIn,
  UserPlus,
  ListChecks,
  GitCompare,
  ShoppingBag,
  Scale,
  Tags,
  List,
  DollarSign,
  Ticket,
  CreditCard,
  Presentation,
  Wrench,
} from "lucide-react";

type ContentTypeRule = {
  match: string[];
  icon: React.ElementType;
  description: string;
};

const DEFAULT_DESCRIPTION =
  "Create high-quality content around {keyword} with a {intent} focus, optimized for search, engagement, and conversions.";

const CONTENT_TYPE_RULES: ContentTypeRule[] = [
  // ─────────────────────────────────────────────
  // Informational
  // ─────────────────────────────────────────────

  {
    match: ["blog"],
    icon: Newspaper,
    description:
      "Explore {keyword} through engaging content that answers readers’ questions and delivers the information they’re looking for with {intent} intent.",
  },

  {
    match: ["how-to-guide"],
    icon: BookOpen,
    description:
      "Show readers how to accomplish a task or solve a problem involving {keyword} with clear, actionable steps suited to their {intent} intent.",
  },

  {
    match: ["explainer"],
    icon: FileText,
    description:
      "Break down {keyword} into clear concepts, processes, and key details to help readers understand the topic and satisfy their {intent} intent.",
  },

  {
    match: ["pillar-content"],
    icon: Layout,
    description:
      "Build a comprehensive resource covering {keyword} in depth, giving readers the information they need to satisfy their {intent} intent.",
  },

  {
    match: ["checklist"],
    icon: ListChecks,
    description:
      "Give readers a practical checklist for completing important tasks related to {keyword}, helping them accomplish what they need with {intent} intent.",
  },

  {
    match: ["tutorial"],
    icon: BookOpen,
    description:
      "Guide readers through {keyword} with practical, step-by-step instructions that help them achieve their goal with {intent} intent.",
  },

  {
    match: ["faq"],
    icon: HelpCircle,
    description:
      "Answer common questions about {keyword} with quick, useful information that helps readers find what they need with {intent} intent.",
  },

  {
    match: ["white-paper"],
    icon: FileCheck2,
    description:
      "Provide in-depth research, insights, and analysis on {keyword} for readers looking for detailed information with {intent} intent.",
  },

  {
    match: ["case-study"],
    icon: Target,
    description:
      "Show how real-world strategies and results can be applied to {keyword}, giving readers practical insights that support their {intent} intent.",
  },

  {
    match: ["glossary"],
    icon: Tags,
    description:
      "Explain important terms and definitions related to {keyword}, helping readers quickly understand the topic with {intent} intent.",
  },

  {
    match: ["resource-list"],
    icon: List,
    description:
      "Curate useful tools, resources, and references related to {keyword} so readers can quickly find what they need with {intent} intent.",
  },

  // ─────────────────────────────────────────────
  // Commercial
  // ─────────────────────────────────────────────

  {
    match: ["comparison"],
    icon: GitCompare,
    description:
      "Compare products, services, or solutions related to {keyword} to help readers evaluate their options and make the right choice with {intent} intent.",
  },

  {
    match: ["best-tools"],
    icon: Search,
    description:
      "Discover the best tools and solutions for {keyword}, helping readers compare options and find the right fit for their {intent} intent.",
  },

  {
    match: ["alternatives"],
    icon: Scale,
    description:
      "Explore alternatives to {keyword} so readers can compare their options and find the solution that best matches their {intent} intent.",
  },

  {
    match: ["in-depth-review"],
    icon: Search,
    description:
      "Take a closer look at a product or service related to {keyword}, covering its features, benefits, performance, and limitations for {intent} intent.",
  },

  {
    match: ["pros-cons"],
    icon: Scale,
    description:
      "Weigh the key advantages and disadvantages of options related to {keyword} to help readers make a confident choice with {intent} intent.",
  },

  {
    match: ["product-roundup"],
    icon: Package,
    description:
      "Explore a curated selection of products related to {keyword}, helping readers compare options and choose the best one for their {intent} intent.",
  },

  {
    match: ["buying-guide"],
    icon: ShoppingBag,
    description:
      "Help readers evaluate products related to {keyword} with practical advice that guides them toward a confident decision with {intent} intent.",
  },

  // ─────────────────────────────────────────────
  // Navigational
  // ─────────────────────────────────────────────

  {
    match: ["brand-page"],
    icon: Sparkles,
    description:
      "Introduce your brand, values, and positioning while helping visitors find the information they need about {keyword} with {intent} intent.",
  },

  {
    match: ["product-homepage"],
    icon: Home,
    description:
      "Introduce your product and show visitors how it can help them with {keyword} based on what they’re looking for with {intent} intent.",
  },

  {
    match: ["feature-overview"],
    icon: Layout,
    description:
      "Showcase your product’s key features and explain how they address needs related to {keyword} for visitors with {intent} intent.",
  },

  {
    match: ["documentation"],
    icon: BookOpen,
    description:
      "Help users understand, configure, and implement solutions related to {keyword} with clear documentation that supports their {intent} intent.",
  },

  {
    match: ["login-guide"],
    icon: LogIn,
    description:
      "Help users access their account and resolve common login issues related to {keyword} with clear guidance that meets their {intent} intent.",
  },

  {
    match: ["contact-us"],
    icon: MessageSquare,
    description:
      "Give visitors clear ways to contact your team with questions, support requests, or inquiries related to {keyword} based on their {intent} intent.",
  },

  {
    match: ["about-us"],
    icon: User,
    description:
      "Share your company’s story, mission, values, and team while helping visitors learn more about {keyword} based on their {intent} intent.",
  },

  {
    match: ["help-center"],
    icon: HelpCircle,
    description:
      "Help users find answers, guidance, and troubleshooting support for issues related to {keyword} based on their {intent} intent.",
  },

  // ─────────────────────────────────────────────
  // Transactional
  // ─────────────────────────────────────────────

  {
    match: ["sales-page"],
    icon: DollarSign,
    description:
      "Showcase the value of your offering and encourage visitors interested in {keyword} to take the next step based on their {intent} intent.",
  },

  {
    match: ["pricing-page"],
    icon: CreditCard,
    description:
      "Present pricing plans, features, and value clearly for users evaluating solutions related to {keyword} with {intent} intent.",
  },

  {
    match: ["signup-page"],
    icon: UserPlus,
    description:
      "Encourage visitors interested in {keyword} to create an account and take the next step toward their {intent} goal.",
  },

  {
    match: ["demo-page"],
    icon: Presentation,
    description:
      "Show visitors how your product can help with {keyword} and encourage them to request a demo based on their {intent} intent.",
  },

  {
    match: ["coupon-page"],
    icon: Ticket,
    description:
      "Highlight discounts, special offers, and coupon codes for products or services related to {keyword}, helping users find relevant deals with {intent} intent.",
  },

  {
    match: ["checkout-page"],
    icon: CreditCard,
    description:
      "Help customers interested in {keyword} complete their purchase through a simple, secure experience that supports their {intent} goal.",
  },

  {
    match: ["landing-page"],
    icon: Target,
    description:
      "Create a focused landing page around {keyword} with a compelling offer and clear call to action designed for {intent} intent.",
  },

  {
    match: ["service-page"],
    icon: Wrench,
    description:
      "Showcase your service and explain how it helps customers solve problems related to {keyword} while supporting their {intent} intent.",
  },
];
function normalizeType(type: string) {
  return type.toLowerCase().replace(/[-_]/g, " ").trim();
}

export function getContentTypeConfig(type: string) {
  const normalized = normalizeType(type);

  const rule = CONTENT_TYPE_RULES.find((rule) =>
    rule.match.some((keyword) => normalizeType(keyword) === normalized),
  );

  return (
    rule ?? {
      icon: FileText,
      description: DEFAULT_DESCRIPTION,
    }
  );
}
