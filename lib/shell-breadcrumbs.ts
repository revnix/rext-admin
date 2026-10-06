/**
 * The header's breadcrumb (design/app-language.md §5): where a page sits, worked out from its
 * path alone, so a new page gets a sensible trail without registering anything. A segment the
 * maps below don't name is written out in sentence case; an id reads "Details".
 */

export interface Crumb {
  label: string;
  /** Absent on the last crumb, the current page. */
  href?: string;
}

/** The workspace's sections, with the pages under them. */
const WORKSPACE_SECTIONS: Record<
  string,
  { label: string; parent?: "settings"; pages?: Record<string, string> }
> = {
  generate_content: { label: "Generate" },
  content: { label: "Content", pages: { create: "New article" } },
  personas: { label: "Personas", pages: { create: "New persona" } },
  integrations: { label: "Integrations" },
  settings: { label: "Settings", pages: { trash: "Trash" } },
  brand_voice: { label: "Brand voice", parent: "settings" },
  members: { label: "Members", parent: "settings" },
};

/** What an id stands for under each workspace section. */
const WORKSPACE_DETAIL: Record<string, string> = {
  content: "Article",
  personas: "Persona",
};

/** Pages that live under another section in the URL but are items of their own in the sidebar. */
const OWN_ITEMS: Record<string, string> = {
  "content/calendar": "Calendar",
  "generate_content/library": "Keywords",
};

/** Pages outside a workspace: the first segment, then the pages under it. */
const TOP_LEVEL: Record<
  string,
  { label: string; pages?: Record<string, string> }
> = {
  w: { label: "Workspaces", pages: { create: "New workspace" } },
  settings: {
    label: "Account",
    pages: {
      security: "Security",
      sessions: "Sessions",
      subscription: "Subscription",
      billing: "Billing",
      trash: "Trash",
    },
  },
  subscription: { label: "Subscription" },
  billing: { label: "Billing" },
  usage: { label: "Usage" },
  pricing: { label: "Pricing" },
  legal: {
    label: "Legal",
    pages: {
      terms: "Terms of service",
      privacy: "Privacy policy",
      "refund-policy": "Refund policy",
      "subscription-terms": "Subscription terms",
    },
  },
  admin: {
    label: "Admin",
    pages: {
      users: "Users",
      subscriptions: "Subscriptions",
      plans: "Plans",
      refunds: "Refunds",
      monitoring: "Monitoring",
      "email-analytics": "Email analytics",
      "email-templates": "Email templates",
      roles: "Roles and permissions",
      "audit-logs": "Audit logs",
      security: "Security",
      statistics: "Statistics",
      webhooks: "Webhooks",
      analytics: "Analytics",
      invitations: "Invitations",
      platform: "Platform",
    },
  },
};

const ID =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|[\w-]{20,})$/i;

function humanize(segment: string): string {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function pageLabel(
  segment: string,
  pages: Record<string, string> = {},
): string {
  return pages[segment] ?? (ID.test(segment) ? "Details" : humanize(segment));
}

/** Folders with pages under them but no page of their own. */
const NO_PAGE = new Set(["/legal", "/admin/analytics", "/admin/platform"]);

/** Gives every crumb but the last its link, where there is a page to link to. */
function withLinks(trail: { label: string; path: string }[]): Crumb[] {
  return trail.map(({ label, path }, index) =>
    index === trail.length - 1 || NO_PAGE.has(path)
      ? { label }
      : { label, href: path },
  );
}

function workspaceTrail(
  slug: string,
  rest: string[],
  workspaceName: string,
): { label: string; path: string }[] {
  const base = `/w/${slug}`;
  const trail = [{ label: workspaceName, path: "/" }];
  const [section, ...pages] = rest;
  if (!section) return trail;

  const own = pages[0] && OWN_ITEMS[`${section}/${pages[0]}`];
  if (own) {
    trail.push({ label: own, path: `${base}/${section}/${pages[0]}` });
    return trail;
  }

  const known = WORKSPACE_SECTIONS[section];
  if (known?.parent) {
    const parent = WORKSPACE_SECTIONS[known.parent];
    trail.push({ label: parent.label, path: `${base}/${known.parent}` });
  }
  trail.push({
    label: known?.label ?? humanize(section),
    path: `${base}/${section}`,
  });

  let path = `${base}/${section}`;
  for (const page of pages) {
    path += `/${page}`;
    const label =
      known?.pages?.[page] ??
      (ID.test(page)
        ? (WORKSPACE_DETAIL[section] ?? "Details")
        : humanize(page));
    trail.push({ label, path });
  }
  return trail;
}

export function buildBreadcrumbs(
  pathname: string,
  workspaceName = "Workspace",
): Crumb[] {
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Home" }];

  const [first, second, ...rest] = segments;
  if (first === "w" && second && second !== "create") {
    return withLinks(workspaceTrail(second, rest, workspaceName));
  }

  const top = TOP_LEVEL[first];
  const trail = [{ label: top?.label ?? humanize(first), path: `/${first}` }];
  let path = `/${first}`;
  for (const page of segments.slice(1)) {
    path += `/${page}`;
    trail.push({ label: pageLabel(page, top?.pages), path });
  }
  return withLinks(trail);
}
