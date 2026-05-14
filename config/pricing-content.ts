export interface PricingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface PricingSupportLink {
  id: string;
  href: string;
  label: string;
}

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    id: "plan-changes",
    question: "Can I change plans anytime?",
    answer:
      "Yes. You can upgrade or downgrade from your subscription dashboard. Plan change timing and proration depend on your current billing rules.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer:
      "We support major credit cards and additional methods exposed by our payment provider checkout flow.",
  },
  {
    id: "free-trial",
    question: "Is there a free trial?",
    answer:
      "New accounts start with a free trial period. No credit card is required to begin.",
  },
  {
    id: "cancellation",
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel from your billing settings and keep access until your current period ends unless an immediate cancel option is selected.",
  },
  {
    id: "data-retention",
    question: "What happens to my data if I cancel?",
    answer:
      "Your data retention window follows the current subscription and refund policy. Refer to legal pages for exact timelines.",
  },
  {
    id: "refunds",
    question: "Do you offer refunds?",
    answer:
      "Refund handling follows our published refund policy and support review workflow.",
  },
];

export const PRICING_SUPPORT_LINKS: PricingSupportLink[] = [
  {
    id: "dashboard",
    href: "/subscription",
    label: "View Subscription Dashboard",
  },
  { id: "support", href: "mailto:support@wrext.com", label: "Contact Support" },
  { id: "docs", href: "/docs/pricing", label: "View Documentation" },
];
