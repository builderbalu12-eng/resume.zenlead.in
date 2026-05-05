import * as React from "react";
import { AppHeader } from "./AppHeader";

export function AppShell({
  children,
  primaryAction,
}: {
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
}) {
  return (
    <>
      <AppHeader primaryAction={primaryAction} />
      <div style={{ paddingTop: 60 }}>
        <div className="px-4 py-6 md:px-6 md:py-8 animate-in-soft">
          {children}
        </div>
      </div>
    </>
  );
}
