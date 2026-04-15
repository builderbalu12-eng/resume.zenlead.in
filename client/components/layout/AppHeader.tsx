import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ChevronRight,
  CreditCard,
  LogOut,
  Moon,
  Receipt,
  Sun,
  User as UserIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getRouteTitle } from "./nav";

function getInitials(first?: string, last?: string) {
  const f = first?.slice(0, 1) ?? "";
  const l = last?.slice(0, 1) ?? "";
  return (f + l).toUpperCase();
}

export function AppHeader({
  primaryAction,
}: {
  primaryAction?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const title = getRouteTitle(location.pathname);

  const crumbs = React.useMemo(() => {
    const segs = location.pathname.split("/").filter(Boolean);
    if (segs.length === 0) return [{ label: "Dashboard" }];
    return segs.map((s) => ({ label: s.replace(/-/g, " ") }));
  }, [location.pathname]);

  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <SidebarTrigger className="md:mr-1" />

        <img
          src="/logo/lo9o.png"
          alt="Logo"
          className="h-7 w-7 rounded-lg object-contain bg-white shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
                {title}
              </h1>
              <div className="hidden md:block">
                <Breadcrumb>
                  <BreadcrumbList className="text-xs text-muted-foreground">
                    {crumbs.slice(0, 3).map((c, idx) => (
                      <React.Fragment key={`${c.label}-${idx}`}>
                        <BreadcrumbItem>
                          {idx === crumbs.length - 1 ? (
                            <BreadcrumbPage className="capitalize">
                              {c.label}
                            </BreadcrumbPage>
                          ) : (
                            <span className="capitalize">{c.label}</span>
                          )}
                        </BreadcrumbItem>
                        {idx !== crumbs.length - 1 && (
                          <BreadcrumbSeparator>
                            <ChevronRight className="h-3 w-3" />
                          </BreadcrumbSeparator>
                        )}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-2">
          {primaryAction}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-2 py-1.5",
                  "hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold flex items-center justify-center">
                    {user ? (
                      getInitials(user.firstName, user.lastName) || (
                        <UserIcon className="h-4 w-4" />
                      )
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold">
                    {user ? user.firstName : "Guest"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {user ? user.email : "Not signed in"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")} disabled={!isAuthenticated}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">Usage</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/billing")} disabled={!isAuthenticated}>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/billing#credits")} disabled={!isAuthenticated}>
                <Receipt className="mr-2 h-4 w-4" />
                Credit Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Log in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

