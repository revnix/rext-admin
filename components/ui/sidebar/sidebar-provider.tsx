"use client";

import * as React from "react";
import { useIsCompact, useIsMobile } from "@/hooks/use-mobile";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SIDEBAR_COOKIE_NAME,
  type SidebarPreference,
} from "./sidebar-preference";

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3.5rem";

interface CookieStore {
  set(options: {
    name: string;
    value: string;
    path?: string;
    maxAge?: number;
  }): Promise<void>;
}

export type SidebarContextProps = {
  /** What the sidebar shows now: icons only ("collapsed") or labels. */
  state: "expanded" | "collapsed";
  preference: SidebarPreference;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  /** Under 1024 px, where the sidebar is a sheet. */
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function saveCookie(value: string): void {
  try {
    if ("cookieStore" in window) {
      void (window as Window & { cookieStore: CookieStore }).cookieStore.set({
        name: SIDEBAR_COOKIE_NAME,
        value,
        path: "/",
        maxAge: SIDEBAR_COOKIE_MAX_AGE,
      });
      return;
    }
    const cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
    const descriptor =
      Object.getOwnPropertyDescriptor(Document.prototype, "cookie") ||
      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "cookie");
    descriptor?.set?.call(document, cookie);
  } catch (error) {
    log.warn("Failed to set sidebar cookie:", error);
  }
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({
  defaultPreference = "auto",
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultPreference?: SidebarPreference;
}) {
  const isMobile = useIsMobile();
  const isCompact = useIsCompact();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [preference, setPreference] =
    React.useState<SidebarPreference>(defaultPreference);

  const open = preference === "auto" ? !isCompact : preference === "expanded";

  const setOpen = React.useCallback((value: boolean) => {
    setPreference(value ? "expanded" : "collapsed");
    saveCookie(String(value));
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Leaving phone width closes the sheet, so it is not open behind the desktop sidebar.
  React.useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile]);

  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed";

  const value = React.useMemo(
    () => ({
      state,
      preference,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, preference, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
