import * as React from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Settings } from "@/components/Settings";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppShell({
  children,
  primaryAction,
}: {
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          onOpenSettings={() => setSettingsOpen(true)}
          primaryAction={primaryAction}
        />

        <Settings
          isOpen={settingsOpen && isAuthenticated}
          onClose={() => setSettingsOpen(false)}
        />

        <div className="px-4 py-6 md:px-6 md:py-8 animate-in-soft">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

