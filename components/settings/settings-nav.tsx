"use client";

import { CreditCard, type LucideIcon, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  accountSettingsRoutes,
  type AccountSettingsRoute,
} from "@/lib/routes";

type SettingsNavItem = {
  label: string;
  href: AccountSettingsRoute;
  icon: LucideIcon;
};

const settingsNavItems: SettingsNavItem[] = [
  {
    label: "Account & Preferences",
    href: accountSettingsRoutes.root,
    icon: User,
  },
  {
    label: "Security",
    href: accountSettingsRoutes.security,
    icon: Shield,
  },
  {
    label: "Billing",
    href: accountSettingsRoutes.billing,
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
            href={route.href}
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
