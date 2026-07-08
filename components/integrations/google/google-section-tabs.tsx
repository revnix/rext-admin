"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { workspaceRoutes } from "@/lib/routes";
import type { Route } from "next";

interface GoogleSectionTabsProps {
  workspaceSlug: string;
}

/**
 * Tab nav shared by the 3 top-level Google pages (Dashboard, Content
 * Inventory, Opportunities) — NOT used on the per-article detail page,
 * which renders via DetailPageWrapper's own PageLayout instead.
 */
export function GoogleSectionTabs({ workspaceSlug }: GoogleSectionTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Dashboard",
      href: workspaceRoutes.googleIntegration.dashboard(workspaceSlug),
    },
    {
      name: "Content Inventory",
      href: workspaceRoutes.googleIntegration.contentInventory(workspaceSlug),
    },
    {
      name: "Opportunities",
      href: workspaceRoutes.googleIntegration.opportunities(workspaceSlug),
    },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href as Route}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
