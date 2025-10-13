"use client";

import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DetailPageProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  children: ReactNode;
}

/**
 * Standard layout for detail/view pages
 *
 * @example
 * ```tsx
 * <DetailPage
 *   title="Workspace Settings"
 *   subtitle="Configure workspace preferences"
 *   breadcrumbs={[
 *     { label: 'Workspaces', href: '/workspaces' },
 *     { label: 'My Workspace', href: '/workspaces/123' },
 *     { label: 'Settings' }
 *   ]}
 *   actions={
 *     <>
 *       <Button variant="outline">Cancel</Button>
 *       <Button>Save Changes</Button>
 *     </>
 *   }
 * >
 *   <Card>...</Card>
 * </DetailPage>
 * ```
 */
export function DetailPage({
  title,
  subtitle,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
}: DetailPageProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                  }
                `}
                aria-current={activeTab === tab.value ? "page" : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
