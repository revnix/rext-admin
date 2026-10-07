"use client";

import { useQuery } from "@tanstack/react-query";
import { PlanGrid } from "@/components/billing/plan-grid";
import { PricingFaq } from "@/components/billing/pricing-faq";
import { ListPage } from "@/components/layouts";
import { subscriptionQueries } from "@/lib/query-keys";

/**
 * Plans and pricing inside the shell (plans/app/F-billing.md §2 items 2, 7 and 8): the plan grid
 * and the questions, every number from the public catalogue. A signed-out visit goes to the site's
 * pricing page (proxy.ts).
 */
export default function PricingPage() {
  const { data: catalog } = useQuery(subscriptionQueries.catalog());
  const perArticle = catalog?.credits.per_article;

  return (
    <ListPage
      title="Plans"
      description={
        perArticle
          ? `The plans differ in credits a month, workspaces and members. One article is ${perArticle} credits.`
          : "The plans differ in credits a month, workspaces and members."
      }
    >
      <div className="flex flex-col gap-12">
        <PlanGrid />
        <PricingFaq />
      </div>
    </ListPage>
  );
}
