"use client";

import { FileText, House, Menu, SquarePen } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ShellNavigation } from "./use-shell-navigation";

const cell =
  "flex h-full w-full flex-col items-center justify-center gap-1 text-caption text-muted-foreground transition-colors duration-(--duration-fast) ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset [&>svg]:size-5";

/**
 * Under 1024 px, the four places people go most, always in reach (language §5, the research's
 * §11.3 after Vercel): Home, Generate, Content, and More, which opens the sidebar as a sheet.
 */
export function MobileBottomBar({
  navigation,
}: {
  navigation: ShellNavigation;
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  const { generate, main, activeUrl } = navigation;
  const content = main.find((item) => item.title === "Content");

  const links: {
    title: string;
    url: string;
    icon: ComponentType;
    primary?: boolean;
  }[] = [
    { title: "Home", url: "/", icon: House },
    ...(generate
      ? [
          {
            title: "Generate",
            url: generate.url,
            icon: SquarePen,
            primary: true,
          },
        ]
      : []),
    ...(content
      ? [{ title: "Content", url: content.url, icon: FileText }]
      : []),
  ];

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-border bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex h-14">
        {links.map(({ title, url, icon: Icon, primary }) => {
          const current = url === activeUrl;
          return (
            <li key={title} className="flex-1">
              <Link
                href={url as Route}
                aria-current={current ? "page" : undefined}
                className={cn(
                  cell,
                  current && "font-medium text-foreground",
                  primary && "text-primary",
                )}
              >
                <Icon />
                {title}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(true)}
            className={cn(cell, "cursor-pointer")}
          >
            <Menu />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
