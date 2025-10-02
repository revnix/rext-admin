"use client";

import { Bell, CreditCard, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const settingsRoutes = [
  {
    label: "General",
    href: "/settings/general",
    icon: Settings,
  },
  {
    label: "Account",
    href: "/settings/account",
    icon: User,
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: Shield,
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Settings navigation">
      {settingsRoutes.map((route) => {
        const Icon = route.icon;
        const isActive = pathname === route.href;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
