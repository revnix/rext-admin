"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

/**
 * ✅ Simplified BreadcrumbLink — uses Next.js <Link> directly
 * Prevents double <a> tags and page reloads.
 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & {
    asChild?: boolean;
  }
>(({ href, className, children, ...props }, ref) => {
  // If href provided, render Next.js Link for client-side navigation
  if (href) {
    return (
      <Link
        href={href}
        ref={ref as any}
        className={cn(
          "hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }

  // Otherwise, render a normal <a> (no navigation)
  return (
    <a
      ref={ref}
      className={cn(
        "hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

/**
 * High-level breadcrumb component for consistent navigation
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Workspaces', href: '/workspaces' },
 *     { label: workspace.name, href: `/workspaces/${workspace.id}` },
 *     { label: 'Settings' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
}: {
  items: Array<{
    label: string;
    href?: string;
    icon?: ReactNode;
  }>;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <span key={`${item.label}-${index}`} className="contents">
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>
                  {item.icon}
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5">
                  {item.icon}
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
