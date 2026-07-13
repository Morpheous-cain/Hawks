import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/**
 * Unified sidebar collapse toggle — matches PlatformShell's chevron toggle so
 * Field & Client portals look identical to Management.
 */
export const SidebarCollapseToggle = ({ className }: Props) => {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const collapsed = isMobile ? !openMobile : state === "collapsed";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn("inline-flex", className)}
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
};

export default SidebarCollapseToggle;
