/**
 * What every analytics event carries (rext-control task 712): the workspace on screen, the role,
 * and the plan. Worked out here from what the app knows at the moment, so the provider can set it
 * the same way from a component and from outside one.
 */

export interface EventContext {
  /** The workspace on screen, or null on a page that belongs to none. */
  workspace_id: string | null;
  role: string | null;
  plan: string | null;
  plan_status: string | null;
  billing_period: string | null;
}

interface ContextInput {
  /** The workspace the page's address names, if it names one. */
  routeSlug: string | null | undefined;
  /** The workspace the app last opened, which may be another one until this page's has loaded. */
  workspace: { id?: string; slug?: string } | null | undefined;
  role: string | null | undefined;
  subscription:
    | {
        plan_name?: string | null;
        status?: string | null;
        billing_period?: string | null;
      }
    | null
    | undefined;
}

export function eventContext({
  routeSlug,
  workspace,
  role,
  subscription,
}: ContextInput): EventContext {
  // Only the workspace the address names: the one opened before it stays in the app's memory
  // until this page's own has loaded, and an event must never carry the wrong one.
  const onScreen =
    routeSlug && workspace?.id && workspace.slug === routeSlug
      ? workspace.id
      : null;
  const plan = subscription?.plan_name ?? null;
  return {
    workspace_id: onScreen,
    role: role ?? null,
    plan,
    plan_status: plan ? (subscription?.status ?? null) : null,
    billing_period: plan ? (subscription?.billing_period ?? null) : null,
  };
}

/** The workspace an address names (`/w/acme/…`, `/edit/acme/…`), for code outside a component. */
export function workspaceSlugOf(pathname: string): string | null {
  const slug = pathname.match(/^\/(?:w|edit)\/([^/]+)/)?.[1];
  return slug && slug !== "create" ? decodeURIComponent(slug) : null;
}
