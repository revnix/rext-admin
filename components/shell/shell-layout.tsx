import { cookies } from "next/headers";
import type { ReactNode } from "react";

import {
  parseSidebarPreference,
  SIDEBAR_COOKIE_NAME,
} from "@/components/ui/sidebar/sidebar-preference";
import { AppShell } from "./app-shell";

/**
 * The shell for a route layout. It reads the sidebar's saved state on the server, so the first
 * paint is already collapsed or expanded. Every area that has the shell renders this from its
 * layout (`app/w`, `app/(home)`, the account pages, legal, admin); a page never mounts it.
 *
 * `sidebar="collapsed"` is for an area that wants the room (the article editor, task 839): the
 * sidebar starts as icons there whatever was saved, and opens and closes from its trigger for the
 * visit. Nothing is saved from there, so the choice made on the other pages is theirs on leaving.
 */
export async function ShellLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: "collapsed";
}) {
  const cookieStore = await cookies();
  const preference =
    sidebar ??
    parseSidebarPreference(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);
  return (
    <AppShell defaultPreference={preference} rememberSidebar={!sidebar}>
      {children}
    </AppShell>
  );
}
