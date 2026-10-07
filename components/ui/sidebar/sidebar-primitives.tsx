"use client";

import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from "./sidebar-provider";

/*
 * Icons only: when the person collapsed the sidebar (data-collapsible="icon"), or by default from
 * 1024 to 1279 px (data-collapsible="auto"). Each rule is written twice, once per case; Tailwind
 * reads these strings from the source, so they stay whole.
 *
 * Inside the sidebar, `data-collapse="hide"` removes an element when it shows icons only, and
 * `data-collapse="label"` keeps it for screen readers alone (a link's name).
 */
const COLLAPSED_HIDDEN =
  "group-data-[collapsible=icon]:hidden lg:max-xl:group-data-[collapsible=auto]:hidden";
const COLLAPSED_CHILDREN =
  "group-data-[collapsible=icon]:[&_[data-collapse=hide]]:hidden group-data-[collapsible=icon]:[&_[data-collapse=label]]:sr-only lg:max-xl:group-data-[collapsible=auto]:[&_[data-collapse=hide]]:hidden lg:max-xl:group-data-[collapsible=auto]:[&_[data-collapse=label]]:sr-only";
const COLLAPSED_WIDTH =
  "group-data-[collapsible=icon]:w-(--sidebar-width-icon) lg:max-xl:group-data-[collapsible=auto]:w-(--sidebar-width-icon)";

function Sidebar({
  side = "left",
  collapsible = "icon",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  collapsible?: "icon" | "none";
}) {
  const { isMobile, state, preference, openMobile, setOpenMobile } =
    useSidebar();
  // The sheet opens from the bottom bar's More or from the shortcut, not from a Radix trigger,
  // so Radix has nothing to return focus to on close. It returns to what opened it instead.
  const openerRef = React.useRef<HTMLElement | null>(null);

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) max-w-[85vw] gap-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={{
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
          }}
          side={side}
          onOpenAutoFocus={() => {
            openerRef.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            const opener = openerRef.current;
            openerRef.current = null;
            if (opener?.isConnected) {
              event.preventDefault();
              opener.focus();
            }
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              The workspace's pages and account.
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  const dataCollapsible =
    preference === "collapsed" ? "icon" : preference === "auto" ? "auto" : "";

  return (
    <div
      className="group peer hidden text-sidebar-foreground lg:block"
      data-state={state}
      data-collapsible={dataCollapsible}
      data-side={side}
      data-slot="sidebar"
    >
      {/* Holds the sidebar's width in the page's flow; the sidebar itself is fixed. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--duration-base) ease-out",
          COLLAPSED_WIDTH,
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-(--z-sticky) hidden h-svh w-(--sidebar-width) transition-[width] duration-(--duration-base) ease-out lg:flex",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          "border-sidebar-border",
          COLLAPSED_WIDTH,
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col overflow-hidden bg-sidebar",
            COLLAPSED_CHILDREN,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 text-muted-foreground max-lg:size-(--control-height-lg)",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 z-(--z-sticky) hidden w-4 -translate-x-1/2 after:absolute after:inset-y-0 after:left-1/2 after:w-px hover:after:bg-border-strong lg:flex",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        className,
      )}
      {...props}
    />
  );
}

/** The column beside the sidebar: the header, the page (in the shell's own `main`) and the dock. */
function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-w-0 max-w-full flex-1 flex-col bg-background",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none max-lg:h-(--control-height-lg)",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 border-t border-sidebar-border p-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col px-2", className)}
      {...props}
    />
  );
}

/** The 12 px eyebrow over a group (language §5). */
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-sm px-3 max-lg:h-(--control-height-lg) text-caption font-medium tracking-wide text-muted-foreground uppercase outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:size-3.5 [&>svg]:shrink-0",
        COLLAPSED_HIDDEN,
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "absolute top-1.5 right-3 flex aspect-square w-5 cursor-pointer items-center justify-center rounded-sm p-0 text-muted-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:size-4 [&>svg]:shrink-0",
        // A larger hit area on touch screens.
        "after:absolute after:-inset-2 lg:after:hidden",
        COLLAPSED_HIDDEN,
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-body", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

/*
 * A row: 36 px, a 16 px icon, the label at 14 px. Hover is one surface step; the current page is
 * the inset surface and 500 weight, so the fill is never the only cue (language §5). The icon
 * stays put when the sidebar collapses: 8 px of group padding and 12 px of row padding centre a
 * 16 px icon in the 56 px rail, and the label becomes screen-reader text (a span marked
 * `data-icon` stays, for a mark drawn as a span). In the rail the room kept for a badge or an
 * action goes, since both are hidden there.
 */
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-sm px-3 text-left text-body text-muted-foreground outline-hidden ring-sidebar-ring transition-colors duration-(--duration-fast) ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[state=open]:bg-sidebar-accent group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-has-data-[sidebar=menu-badge]/menu-item:pr-10 [&>span]:truncate [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:[&>span:not([data-icon])]:sr-only lg:max-xl:group-data-[collapsible=auto]:[&>span:not([data-icon])]:sr-only group-data-[collapsible=icon]:pr-3! lg:max-xl:group-data-[collapsible=auto]:pr-3!",
  {
    variants: {
      variant: {
        default: "",
        outline:
          "bg-background shadow-hairline hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
      size: {
        // --control-height-lg (40 px) under 1024 px, where the sidebar is a sheet on a touch screen (§9).
        default: "h-9 max-lg:h-(--control-height-lg)",
        sm: "h-8 text-label max-lg:h-(--control-height-lg)",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      // A link is the current page; a button (a group's trigger) holds it, so it says only "true".
      aria-current={isActive ? (asChild ? "page" : "true") : undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  // The tooltip names an icon in the rail, so it exists only there. A hidden tooltip still opened
  // on focus, and in the phone sheet it took the Escape meant for the sheet (task C1).
  if (!tooltip || state !== "collapsed" || isMobile) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" {...tooltip} />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute top-2 right-1 flex aspect-square w-5 max-lg:top-2.5 cursor-pointer items-center justify-center rounded-sm p-0 text-muted-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:size-4 [&>svg]:shrink-0",
        // A 40 px hit area on touch screens.
        "after:absolute after:-inset-2.5 lg:after:hidden",
        // Placed from the row's top (an item can hold a sub-list); under 1024 px every row but the
        // large one is 40 px.
        "lg:peer-data-[size=sm]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-3",
        COLLAPSED_HIDDEN,
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 lg:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

/** A count at the row's end, in the muted colour and tabular figures. */
function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "num pointer-events-none absolute top-2 right-2 flex h-5 max-lg:top-2.5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-caption font-medium text-muted-foreground select-none",
        "lg:peer-data-[size=sm]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-3",
        "peer-data-[active=true]/menu-button:bg-surface-raised",
        COLLAPSED_HIDDEN,
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-9 items-center gap-2 rounded-sm px-3", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-sm"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton className="h-4 w-3/4" data-sidebar="menu-skeleton-text" />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "ml-5 flex min-w-0 flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-2",
        COLLAPSED_HIDDEN,
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? SlotPrimitive.Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-sm px-2 max-lg:h-(--control-height-lg) text-muted-foreground outline-hidden ring-sidebar-ring transition-colors duration-(--duration-fast) ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary",
        size === "sm" ? "text-label" : "text-body",
        COLLAPSED_HIDDEN,
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
};
