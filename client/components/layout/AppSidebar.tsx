import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ACCOUNT_NAV, ADMIN_NAV, PRIMARY_NAV } from "./nav";

export function AppSidebar() {
  const { isAuthenticated, user } = useAuth();
  const { app_name: appName, logo_url: logoUrl } = useAppConfig();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = PRIMARY_NAV;
  const accountItems = React.useMemo(
    () =>
      ACCOUNT_NAV.filter(
        (item) =>
          item.path !== "/billing" || user?.has_payments !== false,
      ),
    [user],
  );

  const guardNav = React.useCallback(
    (item: { path: string; requiresAuth?: boolean }) =>
      (e: React.MouseEvent) => {
        if (item.requiresAuth && !isAuthenticated) {
          e.preventDefault();
          navigate(`/login?redirect=${encodeURIComponent(item.path)}`);
        }
      },
    [isAuthenticated, navigate],
  );

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="p-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent",
            )
          }
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="size-10 rounded-xl object-contain shrink-0 bg-white shadow-sm group-data-[collapsible=icon]:hidden"
          />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">{appName}</span>
            <span className="text-xs text-sidebar-foreground/70">
              Premium tailoring
            </span>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <NavLink to={item.path} onClick={guardNav(item)}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <NavLink to={item.path} onClick={guardNav(item)}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.is_admin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <NavLink to={item.path}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isAuthenticated && (
          <div className="rounded-xl border border-sidebar-border bg-background p-3 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-sidebar-foreground">
              Sign in to unlock tailoring
            </p>
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Upload, tailor, and track applications.
            </p>
            <Button className="mt-3 w-full" variant="gradient" asChild>
              <NavLink to="/login">Sign in</NavLink>
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 group-data-[collapsible=icon]:hidden">
          <NavLink to="/privacy-policy" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">Privacy</NavLink>
          <NavLink to="/terms" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">Terms</NavLink>
          <NavLink to="/refund-policy" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">Refunds</NavLink>
          <NavLink to="/contact" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">Contact</NavLink>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

