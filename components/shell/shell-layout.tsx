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
 */
export async function ShellLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const preference = parseSidebarPreference(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
  );
  return <AppShell defaultPreference={preference}>{children}</AppShell>;
}
