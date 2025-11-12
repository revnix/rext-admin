"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavGroup } from "@/types/navigation";

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [_focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Flatten all items for keyboard navigation
  const allItems = groups.flatMap((group) =>
    group.items.flatMap((item) => {
      if (item.items) {
        return [item, ...item.items];
      }
      return [item];
    }),
  );

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!document.activeElement?.closest("[data-sidebar='menu']")) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < allItems.length - 1 ? prev + 1 : 0;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : allItems.length - 1;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          itemRefs.current[0]?.focus();
          break;
        case "End": {
          e.preventDefault();
          const lastIndex = allItems.length - 1;
          setFocusedIndex(lastIndex);
          itemRefs.current[lastIndex]?.focus();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allItems.length]);

  let itemIndex = 0;

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.groupLabel || `group-${groupIndex}`}>
          {group.groupLabel && (
            <SidebarGroupLabel asChild>
              <h2>{group.groupLabel}</h2>
            </SidebarGroupLabel>
          )}
          <SidebarMenu
            role="menu"
            aria-label={group.groupLabel || "Navigation"}
          >
            {group.items.map((item) => {
              const isParentActive = pathname === item.url;
              const isChildActive = item.items?.some(
                (subItem) => pathname === subItem.url,
              );
              const shouldBeOpen =
                item.isActive || isParentActive || isChildActive;
              const currentItemIndex = itemIndex++;

              if (item.items) {
                // Render collapsible menu item with sub-items
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={shouldBeOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem role="none">
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          className="flex-1"
                          isActive={isParentActive}
                          role="menuitem"
                          aria-current={isParentActive ? "page" : undefined}
                          ref={(el) => {
                            if (el) itemRefs.current[currentItemIndex] = el;
                          }}
                        >
                          <Link href={item.url} tabIndex={0}>
                            {item.icon && (
                              <item.icon
                                aria-hidden="true"
                                className="h-12 w-12"
                              />
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                            aria-label={`Toggle ${item.title} submenu`}
                            aria-expanded={shouldBeOpen}
                          >
                            <ChevronRight
                              className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              aria-hidden="true"
                            />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub
                          role="menu"
                          aria-label={`${item.title} submenu`}
                        >
                          {item.items.map((subItem) => {
                            const subItemIndex = itemIndex++;
                            const isSubItemActive = pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem
                                key={subItem.title}
                                role="none"
                              >
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubItemActive}
                                  role="menuitem"
                                  aria-current={
                                    isSubItemActive ? "page" : undefined
                                  }
                                  ref={(el) => {
                                    if (el) itemRefs.current[subItemIndex] = el;
                                  }}
                                >
                                  <Link href={subItem.url} tabIndex={0}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              } else {
                // Render simple menu item without sub-items
                return (
                  <SidebarMenuItem key={item.title} role="none">
                    <SidebarMenuButton
                      asChild
                      isActive={isParentActive}
                      role="menuitem"
                      aria-current={isParentActive ? "page" : undefined}
                      ref={(el) => {
                        if (el) itemRefs.current[currentItemIndex] = el;
                      }}
                    >
                      <Link href={item.url} tabIndex={0}>
                        {item.icon && <item.icon aria-hidden="true" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
