"use client";

import {
  CreditCard,
  Shield,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { settingsRoutes, type SettingsRoute } from "@/lib/routes";
import type { Route } from "next";

type SettingsNavItem = {
  label: string;
  href: SettingsRoute;
  icon: LucideIcon;
};

const settingsNavItems: SettingsNavItem[] = [
  {
    label: "Account & Preferences",
    href: settingsRoutes.root,
    icon: User,
  },
  {
    label: "Security",
    href: settingsRoutes.security,
    icon: Shield,
  },
  {
    label: "Trash",
    href: settingsRoutes.trash,
    icon: Trash2,
  },
  {
    label: "Billing",
    href: settingsRoutes.subscription,
    icon: CreditCard,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-auto items-center justify-start rounded-none border-b bg-transparent p-0 w-full overflow-x-auto"
      aria-label="Settings navigation"
    >
      {settingsNavItems.map((route, index) => {
        const Icon = route.icon;
        const isActive = pathname === route.href;

        return (
          <Link
            key={route.href}
            href={route.href as Route}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all border-b-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
              index > 0 ? "ml-4" : "ml-0",
              isActive
                ? "border-primary text-primary shadow-none"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
