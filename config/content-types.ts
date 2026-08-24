import {
  FileText,
  BookOpen,
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
  "High-quality content optimized for the keyword {keyword} and designed for engagement and conversion.";

const CONTENT_TYPE_RULES: ContentTypeRule[] = [
  // ─────────────────────────────────────────────
  // Informational
  // ─────────────────────────────────────────────

  {
    match: ["blog"],
    icon: Newspaper,
    description:
      "Insightful long-form content designed to educate and engage readers interested in {keyword}.",
  },

  {
    match: ["how-to-guide"],
    icon: BookOpen,
    description:
      "Step-by-step educational content showing readers how to accomplish a task related to {keyword}.",
  },

  {
    match: ["explainer"],
    icon: FileText,
    description:
      "Clear and informative content that explains the concepts, processes, and important details behind {keyword}.",
  },

  {
    match: ["pillar-content"],
    icon: Layout,
    description:
      "Comprehensive authoritative content providing an in-depth resource covering {keyword} and related topics.",
  },

  {
    match: ["checklist"],
    icon: ListChecks,
    description:
      "Actionable checklist content helping readers complete important tasks or steps related to {keyword}.",
  },

  {
    match: ["tutorial"],
    icon: BookOpen,
    description:
      "Practical instructional content guiding readers through a process or solution related to {keyword}.",
  },

  {
    match: ["faq"],
    icon: HelpCircle,
    description:
      "Quick answers to common questions people have about {keyword}, helping readers find solutions faster.",
  },

  {
    match: ["white-paper"],
    icon: FileCheck2,
    description:
      "In-depth authoritative content presenting research, insights, and analysis about {keyword}.",
  },

  {
    match: ["case-study"],
    icon: Target,
    description:
      "Real-world examples demonstrating strategies, results, and success stories related to {keyword}.",
  },

  {
    match: ["glossary"],
    icon: Tags,
    description:
      "A structured collection of important terms and definitions related to {keyword}.",
  },

  {
    match: ["resource-list"],
    icon: List,
    description:
      "A curated collection of useful resources, tools, and references for readers exploring {keyword}.",
  },

  // ─────────────────────────────────────────────
  // Commercial
  // ─────────────────────────────────────────────

  {
    match: ["comparison"],
    icon: GitCompare,
    description:
      "Side-by-side evaluation of products, services, or solutions related to {keyword} to help readers make informed decisions.",
  },

  {
    match: ["best-tools"],
    icon: Search,
    description:
      "A curated selection of the best tools and solutions for {keyword}, helping readers choose the right option.",
  },

  {
    match: ["alternatives"],
    icon: Scale,
    description:
      "Explores alternative products or services related to {keyword} to help readers find the best fit for their needs.",
  },

  {
    match: ["in-depth-review"],
    icon: Search,
    description:
      "Detailed evaluation of a product or service related to {keyword}, including features, benefits, performance, and limitations.",
  },

  {
    match: ["pros-cons"],
    icon: Scale,
    description:
      "Balanced analysis of the key advantages and disadvantages of options related to {keyword}.",
  },

  {
    match: ["product-roundup"],
    icon: Package,
    description:
      "Curated collection of products related to {keyword}, helping readers compare options and choose the right one.",
  },

  {
    match: ["buying-guide"],
    icon: ShoppingBag,
    description:
      "Practical buying advice helping readers evaluate products and make confident decisions related to {keyword}.",
  },

  // ─────────────────────────────────────────────
  // Navigational
  // ─────────────────────────────────────────────

  {
    match: ["brand-page"],
    icon: Sparkles,
    description:
      "Showcases your brand identity, positioning, and values in relation to {keyword} to build recognition and trust.",
  },

  {
    match: ["product-homepage"],
    icon: Home,
    description:
      "Introduces your product and communicates its value for users searching for {keyword}.",
  },

  {
    match: ["feature-overview"],
    icon: Layout,
    description:
      "Provides an overview of product features and explains how they address needs related to {keyword}.",
  },

  {
    match: ["documentation"],
    icon: BookOpen,
    description:
      "Structured documentation helping users understand, configure, and implement solutions related to {keyword}.",
  },

  {
    match: ["login-guide"],
    icon: LogIn,
    description:
      "Guides users through accessing their account and resolving login-related issues when working with {keyword}.",
  },

  {
    match: ["contact-us"],
    icon: MessageSquare,
    description:
      "Provides visitors with clear ways to contact your team for questions, support, or inquiries about {keyword}.",
  },

  {
    match: ["about-us"],
    icon: User,
    description:
      "Tells the story of your company, mission, values, and team while establishing relevance to {keyword}.",
  },

  {
    match: ["help-center"],
    icon: HelpCircle,
    description:
      "Centralized support content helping users find answers and troubleshoot issues related to {keyword}.",
  },

  // ─────────────────────────────────────────────
  // Transactional
  // ─────────────────────────────────────────────

  {
    match: ["sales-page"],
    icon: DollarSign,
    description:
      "Persuasive sales-focused content communicating the value of your offering for visitors interested in {keyword}.",
  },

  {
    match: ["pricing-page"],
    icon: CreditCard,
    description:
      "Clearly presents pricing plans, features, and value for users evaluating solutions related to {keyword}.",
  },

  {
    match: ["signup-page"],
    icon: UserPlus,
    description:
      "Conversion-focused page encouraging visitors interested in {keyword} to create an account and get started.",
  },

  {
    match: ["demo-page"],
    icon: Presentation,
    description:
      "Encourages visitors interested in {keyword} to request or schedule a product demonstration.",
  },

  {
    match: ["coupon-page"],
    icon: Ticket,
    description:
      "Promotes discounts, special offers, or coupon codes for products and services related to {keyword}.",
  },

  {
    match: ["checkout-page"],
    icon: CreditCard,
    description:
      "Streamlined transactional page helping users interested in {keyword} complete their purchase securely.",
  },

  {
    match: ["landing-page"],
    icon: Target,
    description:
      "Focused conversion page designed around {keyword} with a clear offer and call to action.",
  },

  {
    match: ["service-page"],
    icon: Wrench,
    description:
      "Highlights a service, its benefits, and value for customers searching for solutions related to {keyword}.",
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
