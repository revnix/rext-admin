/**
 * The public plan catalogue (F1, `GET /api/v1/plans`, no sign-in): the one definition of what each
 * plan costs and includes, the trial, what an article costs, and the current offer. The dashboard
 * types no price, credit amount or plan name; it reads them from here.
 */
export interface CatalogPlan {
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  price_monthly_billed_yearly: number;
  yearly_saving_percent: number;
  credits_per_month: number;
  articles_per_month: number;
  price_per_article_monthly: number;
  price_per_article_yearly: number;
  /** `null`: no limit. */
  max_workspaces: number | null;
  max_members_per_workspace: number | null;
}

export interface CatalogTrial {
  plan_name: string;
  days: number;
  credits: number;
  articles: number;
  credits_renew: boolean;
  card_required: boolean;
  max_workspaces: number | null;
  max_members_per_workspace: number | null;
}

export interface CatalogCredits {
  per_article: number;
  stages: { key: string; credits: number }[];
  keyword_change: number;
  outline_regeneration: number;
  minimum_to_start: number;
  low_balance_threshold: number;
  carry_over: boolean;
}

export interface CatalogOffer {
  id: string;
  label: string;
  kind: string;
  /** For `first_month_credit_multiplier`: the first month's credits are multiplied by this. */
  credit_multiplier: number | null;
  bonus_credits: number | null;
  starts_at: string;
  ends_at: string;
}

export interface PlanCatalog {
  currency: string;
  plans: CatalogPlan[];
  trial: CatalogTrial | null;
  credits: CatalogCredits;
  offer: CatalogOffer | null;
}
