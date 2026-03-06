"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";

interface CookieStore {
  set(options: {
    name: string;
    value: string;
    path?: string;
    maxAge?: number;
  }): Promise<void>;
}

export type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document !== "undefined") {
    const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    const cookieDescriptor =
      Object.getOwnPropertyDescriptor(Document.prototype, "cookie") ||
      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "cookie");

    if (cookieDescriptor?.set) {
      cookieDescriptor.set.call(document, cookieString);
    }
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
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) setOpenProp(openState);
      else _setOpen(openState);

      try {
        if (typeof window !== "undefined" && "cookieStore" in window) {
          (window as Window & { cookieStore: CookieStore }).cookieStore.set({
            name: SIDEBAR_COOKIE_NAME,
            value: String(openState),
            path: "/",
            maxAge: SIDEBAR_COOKIE_MAX_AGE,
          });
        } else {
          setCookie(
            SIDEBAR_COOKIE_NAME,
            String(openState),
            SIDEBAR_COOKIE_MAX_AGE,
          );
        }
      } catch (error) {
        log.warn("Failed to set sidebar cookie:", error);
      }
    },
    [open, setOpenProp],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((v) => !v) : setOpen((v) => !v);
  }, [isMobile, setOpen]);

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

  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed";

  const value = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div
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
