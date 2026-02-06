import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Package, Settings, UtensilsCrossed } from "lucide-react";
import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Food Log", icon: UtensilsCrossed, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold">
                N
              </div>
              <span className="truncate text-lg font-semibold tracking-tight">NutriCodex</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton tooltip={item.label} asChild>
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
