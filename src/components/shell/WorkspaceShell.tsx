import { ReactNode } from "react";
import { IconRail } from "./IconRail";
import { ContextualSidebar } from "./ContextualSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomTabs } from "./MobileBottomTabs";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

/**
 * WorkspaceShell — Black Hawk SOC-OS app shell.
 * Desktop: icon rail + contextual sidebar + header.
 * Mobile (<md): rail/sidebar collapse into a Sheet; bottom tab bar gives
 * native-app-style nav with safe-area inset support.
 */
export const WorkspaceShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <IconRail />
      <ContextualSidebar />
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 pb-8 md:px-8 md:py-4 min-h-0">
          <ErrorBoundary>
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </ErrorBoundary>
        </main>
      </div>
      <MobileBottomTabs />
    </div>
  );
};

export default WorkspaceShell;

