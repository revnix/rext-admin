"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageBody, PageFrame } from "./page-frame";
import { PageHeader, type PageHeaderProps } from "./page-header";

/** Plain data, so a server layout.tsx can hand the list to this client component. */
export interface SettingsSection {
  label: string;
  /** Each section is a page of its own; the current one is the longest href the path starts with. */
  href: string;
}

export interface SettingsPageProps extends Omit<PageHeaderProps, "hidden"> {
  sections: SettingsSection[];
  children: ReactNode;
}

function currentSection(pathname: string, sections: SettingsSection[]) {
  let best: SettingsSection | undefined;
  for (const section of sections) {
    const inside =
      pathname === section.href || pathname.startsWith(`${section.href}/`);
    if (inside && (!best || section.href.length > best.href.length))
      best = section;
  }
  return best;
}

/**
 * Account and workspace settings (design/app-language.md §6): the list of sections on the left from
 * 768 px (a select on a phone) and one section at a time beside it, each with its own Save, no wider
 * than a settings form reads well (48 rem). Rendered by the settings area's layout.tsx, so the list
 * stays put while the sections change.
 */
export function SettingsPage({
  sections,
  children,
  ...header
}: SettingsPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = currentSection(pathname, sections);
  const label = `${header.title} sections`;

  return (
    <PageFrame>
      <PageHeader {...header} />
      <PageBody className="flex flex-col gap-6 md:flex-row md:gap-8">
        {sections.length > 1 && (
          <>
            <nav aria-label={label} className="hidden w-52 shrink-0 md:block">
              <ul className="flex flex-col gap-0.5">
                {sections.map(({ label: name, href }) => (
                  <li key={href}>
                    <Link
                      href={href as Route}
                      aria-current={href === current?.href ? "page" : undefined}
                      className="flex h-9 items-center rounded-sm px-3 max-lg:h-(--control-height-lg) text-body text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:bg-surface-inset hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none relative aria-[current=page]:bg-surface-inset aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1.5 aria-[current=page]:before:left-0 aria-[current=page]:before:w-0.5 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-primary"
                    >
                      <span className="truncate">{name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="md:hidden">
              <Select
                value={current?.href}
                onValueChange={(href) => router.push(href as Route)}
              >
                <SelectTrigger aria-label={label} className="w-full">
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(({ label: name, href }) => (
                    <SelectItem key={href} value={href}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div
          data-slot="settings-section"
          className="min-w-0 flex-1 md:max-w-3xl"
        >
          {children}
        </div>
      </PageBody>
    </PageFrame>
  );
}
