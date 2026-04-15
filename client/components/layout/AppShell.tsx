import * as React from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppShell({
  children,
  primaryAction,
}: {
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader primaryAction={primaryAction} />

        <div className="px-4 py-6 md:px-6 md:py-8 animate-in-soft">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

