"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.groupLabel || `group-${groupIndex}`}>
          {group.groupLabel && (
            <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
          )}
          <SidebarMenu>
            {group.items.map((item) => {
              const isParentActive = pathname === item.url;
              const isChildActive = item.items?.some(
                (subItem) => pathname === subItem.url,
              );
              const shouldBeOpen =
                item.isActive || isParentActive || isChildActive;

              if (item.items) {
                // Render collapsible menu item with sub-items
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={shouldBeOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          className="flex-1"
                          isActive={isParentActive}
                        >
                          <Link href={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              } else {
                // Render simple menu item without sub-items
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isParentActive}>
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
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
