"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  Gauge,
  LogOut,
  MessageCircle,
  Receipt,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSupportChat } from "@/hooks/use-support-chat";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { performLogout } from "@/lib/logout-utils";
import { profileQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import { useNotificationStore } from "@/stores/notification-store";
import { initials } from "@/lib/initials";

function avatarUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${resolveApiBaseUrl()}${path}`;
}

/**
 * The account's pages until D6 and plan F make them sections of one settings page: every page
 * the old Personal group listed stays one click away.
 */
const ACCOUNT_PAGES = [
  { title: "Account", url: settingsRoutes.root, icon: UserRound },
  { title: "Plan", url: settingsRoutes.plan, icon: CreditCard },
  { title: "Usage", url: settingsRoutes.usage, icon: Gauge },
  { title: "Invoices", url: settingsRoutes.invoices, icon: Receipt },
] as const;

/** The user menu at the sidebar's foot (design/app-language.md §5). */
export function UserMenu() {
  const { data: session, status } = useSession();
  const { isMobile, state, setOpenMobile } = useSidebar();
  const setDrawerOpen = useNotificationStore((store) => store.setDrawerOpen);
  const chat = useSupportChat();
  const { data: profile } = useQuery({
    ...profileQueries.detail(),
    enabled: status === "authenticated",
  });

  const name = profile?.full_name || session?.user?.name || "Account";
  const email = profile?.email || session?.user?.email || "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              className="px-1.5 text-foreground data-[state=open]:bg-sidebar-accent"
            >
              <Avatar data-icon="" className="size-7 border border-border">
                <AvatarImage src={avatarUrl(profile?.avatar_url)} alt="" />
                <AvatarFallback className="bg-surface-inset text-caption font-medium text-muted-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left">
                <span className="truncate text-body font-medium">{name}</span>
                {email && (
                  <span className="truncate text-caption text-muted-foreground">
                    {email}
                  </span>
                )}
              </span>
              <ChevronsUpDown
                data-collapse="hide"
                className="ml-auto text-muted-foreground"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile || state === "expanded" ? "top" : "right"}
            align={isMobile || state === "expanded" ? "start" : "end"}
            sideOffset={4}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="grid font-normal">
              <span className="truncate text-body font-medium">{name}</span>
              {email && (
                <span className="truncate text-caption text-muted-foreground">
                  {email}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {ACCOUNT_PAGES.map(({ title, url, icon: Icon }) => (
                <DropdownMenuItem key={url} asChild>
                  <Link
                    href={url as Route}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon />
                    {title}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => {
                  setOpenMobile(false);
                  setDrawerOpen(true);
                }}
              >
                <Bell />
                Notifications
              </DropdownMenuItem>
              {chat.available && (
                <DropdownMenuItem
                  onSelect={() => {
                    setOpenMobile(false);
                    void chat.open();
                  }}
                >
                  <MessageCircle />
                  Chat with us
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void performLogout("/login")}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
