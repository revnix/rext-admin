"use client";

import {
  CalendarDays,
  Contact,
  CreditCard,
  FileText,
  Hash,
  House,
  LayoutDashboard,
  Mail,
  Megaphone,
  Monitor,
  Plug,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  Undo2,
  UserCog,
  ScrollText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import { useFilteredNavigation } from "@/hooks/use-filtered-navigation";
import {
  AUDIT_PERMISSIONS,
  BILLING_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  SECURITY_PERMISSIONS,
} from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspaceStore } from "@/stores/workspace";
import type { NavGroup, NavItem } from "@/types/navigation";

/**
 * The sidebar's items in the order of design/app-language.md §5 (DECISIONS D9), filtered by the
 * person's permissions. The sidebar, the phone's bottom bar and the Generate shortcut all read
 * this one list.
 */
export interface ShellNavigation {
  /** The workspace the links point into: the one in the URL, else the last one opened. */
  workspaceSlug: string | null;
  /** Null without a workspace or without content.create. */
  generate: NavItem | null;
  main: NavItem[];
  setup: NavItem[];
  /** Workspace settings; its pages are the items until D5 makes them one settings page. */
  settings: NavItem | null;
  admin: NavItem[];
  /** The url of the item the current page belongs to: the longest one the path starts with. */
  activeUrl: string | null;
}

const urlPath = (url: string) => url.split("?")[0];

function matches(pathname: string, url: string): boolean {
  const path = urlPath(url);
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

export function findActiveUrl(pathname: string, urls: string[]): string | null {
  let best: string | null = null;
  for (const url of urls) {
    if (
      matches(pathname, url) &&
      (!best || urlPath(url).length > urlPath(best).length)
    ) {
      best = url;
    }
  }
  return best;
}

function workspaceGroups(slug: string): NavGroup[] {
  return [
    {
      groupLabel: "generate",
      items: [
        {
          title: "Generate",
          url: workspaceRoutes.generate_content(slug),
          icon: SquarePen,
          permission: "content.create",
          prefetch: false,
        },
      ],
    },
    {
      groupLabel: "main",
      items: [
        { title: "Home", url: "/", icon: House },
        {
          title: "Content",
          url: workspaceRoutes.content(slug),
          icon: FileText,
          permission: "content.read",
        },
        {
          // The keyword library. Its keywords start a generation and can be deleted, so it needs
          // Generate's permission.
          title: "Keywords",
          url: workspaceRoutes.keywordLibrary(slug),
          icon: Hash,
          permission: "content.create",
          prefetch: false,
        },
        {
          title: "Calendar",
          url: workspaceRoutes.content_calendar(slug),
          icon: CalendarDays,
          permission: "content.read",
          prefetch: false,
        },
      ],
    },
    {
      groupLabel: "setup",
      items: [
        {
          title: "Personas",
          url: workspaceRoutes.personas(slug),
          icon: Contact,
          permission: "persona.read",
          prefetch: false,
        },
        {
          title: "Integrations",
          url: workspaceRoutes.integrations(slug),
          icon: Plug,
          permission: "integration.read",
          prefetch: false,
        },
      ],
    },
    {
      groupLabel: "settings",
      items: [
        {
          // No permission of its own: each page is filtered, and the item goes when all do.
          title: "Settings",
          url: workspaceRoutes.settings.root(slug),
          icon: Settings,
          items: [
            {
              // Every member may open General (read-only without workspace.update).
              title: "General",
              url: workspaceRoutes.settings.root(slug),
              prefetch: false,
            },
            {
              title: "Brand voice",
              url: workspaceRoutes.settings.brandVoice(slug),
              permission: "brand_voice.read",
              prefetch: false,
            },
            {
              title: "Members",
              url: workspaceRoutes.settings.members(slug),
              permission: "member.read",
              prefetch: false,
            },
          ],
        },
      ],
    },
  ];
}

// Admin pages are global-scoped (proxy.ts): a workspace grant of the same permission must not
// surface them, and each item has its own permission, so a support role sees Audit logs only.
const ADMIN_GROUP: NavGroup = {
  groupLabel: "admin",
  globalOnly: true,
  items: [
    {
      title: "Overview",
      url: "/admin",
      icon: LayoutDashboard,
      anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      prefetch: false,
    },
    {
      // user.manage is held only by admin and super_admin; the global support role gets the
      // read-only view (user.read is the self-service permission every account holds).
      title: "Users",
      url: "/admin/users",
      icon: UserCog,
      anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT],
      prefetch: false,
    },
    {
      title: "Subscriptions",
      url: "/admin/subscriptions",
      icon: CreditCard,
      permission: BILLING_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      title: "Refunds",
      url: "/admin/refunds",
      icon: Undo2,
      permission: BILLING_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      title: "Monitoring",
      url: "/admin/monitoring",
      icon: Monitor,
      permission: SECURITY_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      // Switching the banner needs security.manage; the page says so to anyone who only reads.
      title: "Incident banner",
      url: "/admin/status",
      icon: Megaphone,
      permission: SECURITY_PERMISSIONS.MANAGE,
      prefetch: false,
    },
    {
      title: "Email analytics",
      url: "/admin/email-analytics",
      icon: Mail,
      permission: SECURITY_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      title: "Roles and permissions",
      url: "/admin/roles",
      icon: Shield,
      permission: ROLE_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      title: "Audit logs",
      url: "/admin/audit-logs",
      icon: ScrollText,
      permission: AUDIT_PERMISSIONS.READ,
      prefetch: false,
    },
    {
      title: "Security",
      url: "/admin/security",
      icon: ShieldCheck,
      permission: SECURITY_PERMISSIONS.READ,
      prefetch: false,
    },
  ],
};

export function useShellNavigation(): ShellNavigation {
  const pathname = usePathname();
  const params = useParams<{ workspaceSlug?: string }>();
  const currentSlug = useWorkspaceStore(
    (state) => state.currentWorkspace?.slug,
  );
  // The same cache entry as the switcher's. The persisted current workspace stands in while it
  // loads, so the items don't flash away on a reload; an account with none gets Home only.
  const { data: workspaceList } = useQuery(workspaceQueries.list());
  const listed = workspaceList?.workspaces;
  const workspaceSlug =
    params.workspaceSlug ??
    (listed && listed.length === 0
      ? null
      : (currentSlug ?? listed?.[0]?.slug ?? null));

  const groups = useMemo<NavGroup[]>(
    () =>
      workspaceSlug
        ? [...workspaceGroups(workspaceSlug), ADMIN_GROUP]
        : [
            {
              groupLabel: "main",
              items: [{ title: "Home", url: "/", icon: House }],
            },
            ADMIN_GROUP,
          ],
    [workspaceSlug],
  );
  const filtered = useFilteredNavigation(groups);

  return useMemo(() => {
    const group = (label: string) =>
      filtered.find((g) => g.groupLabel === label)?.items ?? [];
    const main = group("main");
    const setup = group("setup");
    const settings = group("settings")[0] ?? null;
    const admin = group("admin");
    const generate = group("generate")[0] ?? null;
    // Generate's url is a candidate too, so its flow marks it current.
    const urls = [
      ...(generate ? [generate] : []),
      ...main,
      ...setup,
      ...admin,
      ...(settings?.items ?? []),
    ].map((item) => item.url);

    return {
      workspaceSlug,
      generate,
      main,
      setup,
      settings,
      admin,
      activeUrl: findActiveUrl(pathname, urls),
    };
  }, [filtered, pathname, workspaceSlug]);
}
