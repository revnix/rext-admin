"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import type { PlanCatalog } from "@/types/plan-catalog";

/** The pipeline's billed stages, by the catalogue's keys (`credit_manager.py`). */
const STAGE_NAMES: Record<string, string> = {
  serp_seo: "Search and SEO analysis",
  title_generation: "Title",
  generate_outline: "Outline",
  deep_research: "Research",
  content_drafting: "Draft",
  featured_image: "Featured image",
  humanization: "Rewrite for a natural voice",
  eeat_optimization: "Experience and trust signals",
};

const count = (n: number) => n.toLocaleString("en-US");

function answers(catalog: PlanCatalog) {
  const { credits, trial } = catalog;
  const items: { question: string; answer: ReactNode }[] = [
    {
      question: "What does an article cost?",
      answer: (
        <span className="flex flex-col gap-2">
          <span>
            {count(credits.per_article)} credits, whatever its length, spent
            stage by stage:
          </span>
          <span className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
            {credits.stages.map((stage) => (
              <span key={stage.key} className="contents">
                <span>
                  {STAGE_NAMES[stage.key] ?? stage.key.replaceAll("_", " ")}
                </span>
                <span className="num text-right">{count(stage.credits)}</span>
              </span>
            ))}
          </span>
          <span>
            Changing the keyword costs {count(credits.keyword_change)} more, and
            writing the outline again {count(credits.outline_regeneration)}. An
            article starts only with {count(credits.minimum_to_start)} credits
            or more.
          </span>
        </span>
      ),
    },
    {
      question: "Do unused credits carry over?",
      answer: credits.carry_over
        ? "Yes: what you don't use this month is still yours next month."
        : "No. Each month starts again at your plan's credits.",
    },
  ];
  if (trial) {
    items.push({
      question: "Is there a free trial?",
      answer: `Yes: a new account starts with ${count(trial.days)} days and ${count(trial.credits)} credits, about ${count(trial.articles)} articles${trial.card_required ? "" : ", with no card needed"}. ${trial.credits_renew ? "" : "The trial's credits don't renew. "}Choose a plan here at any time.`,
    });
  }
  items.push(
    {
      question: "Can I change or cancel my plan?",
      answer: (
        <>
          Yes, in{" "}
          <Link
            href={settingsRoutes.plan as Route}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Account settings → Billing
          </Link>
          .
        </>
      ),
    },
    {
      question: "Can I get a refund?",
      answer: (
        <>
          The{" "}
          <Link
            href={"/legal/refund-policy" as Route}
            className="font-medium text-foreground underline underline-offset-4"
          >
            refund policy
          </Link>{" "}
          says when, and how to ask. Questions go to{" "}
          <a
            href="mailto:contact@rext.ai"
            className="font-medium text-foreground underline underline-offset-4"
          >
            contact@rext.ai
          </a>
          .
        </>
      ),
    },
  );
  return items;
}

/**
 * The pricing page's questions, each answered from the catalogue or by a link to where the answer
 * lives (plans/app/F-billing.md §2 item 8: nothing the backend doesn't do).
 */
export function PricingFaq() {
  const { data: catalog } = useQuery(subscriptionQueries.catalog());
  if (!catalog) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section">Questions</h2>
      <dl className="grid gap-6 md:grid-cols-2">
        {answers(catalog).map((item) => (
          <div key={item.question} className="flex flex-col gap-1">
            <dt className="font-medium">{item.question}</dt>
            <dd className="text-sm text-muted-foreground">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
