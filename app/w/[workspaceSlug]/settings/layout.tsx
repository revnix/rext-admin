"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";

const settingsTabs = [
  {
    name: "Workspace",
    href: "",
    icon: Building2,
  },
];

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workspaceSlug } = useWorkspace();
  const pathname = usePathname();

  return (
    <PageLayout
      title="Workspace Settings"
      description="Manage workspace configuration and preferences"
    >
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {settingsTabs.map((tab) => {
              const href = tab.href
                ? `/w/${workspaceSlug}/settings/${tab.href}`
                : `/w/${workspaceSlug}/settings`;
              const isActive = pathname === href;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.name}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 lg:max-w-3xl">{children}</div>
      </div>
    </PageLayout>
  );
}
