"use client";

import { Bell, CircleQuestionMark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildBreadcrumbs } from "@/lib/shell-breadcrumbs";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useNotificationStore } from "@/stores/notification-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { CreditMeter } from "./credit-meter";

const HELP_URL = "https://rext.ai/help";

/** 32 px with a mouse; 40 px under 1024 px, where the shell is on a touch screen (§9). */
const iconButton =
  "size-8 rounded-sm text-muted-foreground hover:bg-surface-inset hover:text-foreground max-lg:size-(--control-height-lg)";

/** Where the page sits; under 640 px only the page itself, so the trail never wraps. */
function ShellBreadcrumb() {
  const pathname = usePathname();
  const workspaceName = useWorkspaceStore((state) =>
    getWorkspaceDisplayTitle(state.currentWorkspace, "Workspace"),
  );
  const crumbs = buildBreadcrumbs(pathname, workspaceName);

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap gap-1.5 text-body sm:gap-1.5">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href ?? crumb.label}>
              <BreadcrumbItem
                className={last ? "min-w-0" : "hidden shrink-0 sm:inline-flex"}
              >
                {last ? (
                  <BreadcrumbPage className="w-auto font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink
                    href={crumb.href}
                    // 40 px tall to a finger, without moving the header's line.
                    className="max-w-48 truncate max-lg:-my-2.5 max-lg:py-2.5"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="max-w-48 truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className="hidden sm:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function NotificationsButton() {
  const unread = useNotificationStore((state) => state.unreadCount);
  const setDrawerOpen = useNotificationStore((state) => state.setDrawerOpen);
  const label =
    unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className={`relative ${iconButton}`}
          onClick={() => setDrawerOpen(true)}
        >
          <Bell />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-surface"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Notifications</TooltipContent>
    </Tooltip>
  );
}

function HelpLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild className={iconButton}>
          <a
            href={HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Help center (opens in a new tab)"
          >
            <CircleQuestionMark />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Help center</TooltipContent>
    </Tooltip>
  );
}

/**
 * The header (design/app-language.md §5): 56 px on the page's surface with a hairline beneath;
 * the breadcrumb on the left, the credits meter, notifications and help on the right. No search
 * until there is one to offer (task C9), no theme toggle (light only, task B4).
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-(--z-sticky) flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-surface px-4 md:px-6">
      <SidebarTrigger className="-ml-1 hidden lg:inline-flex" />
      <Link
        href={"/" as Route}
        aria-label="Rext AI home"
        className="-ml-2.5 inline-flex size-(--control-height-lg) shrink-0 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
      >
        <Image
          src="/logos/icon_dark.svg"
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
      </Link>
      <ShellBreadcrumb />
      <div className="flex shrink-0 items-center gap-1">
        <CreditMeter variant="header" className="hidden sm:flex" />
        <NotificationsButton />
        <HelpLink />
      </div>
    </header>
  );
}
