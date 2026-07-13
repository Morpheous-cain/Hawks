import { cn } from "@/lib/utils";

// Unified sidebar styling system for all portals
export const sidebarStyles = {
  // Base sidebar container - consistent across all portals
  container: "border-r border-primary/20 shadow-[4px_0_24px_hsl(var(--primary)/0.1)] bg-gradient-to-b from-card/95 to-background/95 backdrop-blur-sm",
  
  // Header styling - sticky with glassmorphism
  header: "border-b border-primary/20 bg-gradient-to-b from-card to-background sticky top-0 z-20",
  headerContent: "flex items-center gap-3 p-3",
  
  // Logo container with glow effect
  logoContainer: "relative p-1.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-lg flex-shrink-0",
  logoGlow: "absolute inset-0 rounded-xl bg-primary/10 blur-md animate-pulse",
  logo: "relative w-10 h-10 object-contain rounded-lg",
  
  // Brand text styling - high contrast white text
  brandTitle: "font-bold text-white tracking-tight text-base leading-tight",
  brandSubtitle: "text-[11px] font-semibold text-sidebar-primary uppercase tracking-widest",
  
  // User info section with subtle background
  userSection: "p-3 border-b border-sidebar-border bg-sidebar/50",
  userAvatar: "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-lg",
  userName: "text-sm font-medium truncate text-white leading-tight",
  userStatus: "text-xs text-sidebar-muted-foreground flex items-center gap-1.5",
  statusDot: "w-2 h-2 rounded-full",
  statusOnline: "bg-alert-normal animate-pulse",
  statusOffline: "bg-sidebar-muted-foreground",
  
  // Group styling - visible labels
  groupLabel: "text-[11px] font-bold uppercase tracking-widest text-sidebar-muted-foreground px-2 py-2",
  
  // Menu item - base state
  menuItem: "relative transition-all duration-200 rounded-lg mx-1",
  
  // Menu button states - high contrast text
  menuButton: cn(
    "relative overflow-hidden transition-all duration-200 rounded-md text-white/90",
    "hover:bg-sidebar-primary/20 hover:text-white",
    "focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 focus-visible:outline-none",
    "active:scale-[0.98]"
  ),
  
  // Active menu button - Management Portal (Cyan)
  menuButtonActive: cn(
    "bg-gradient-to-r from-primary to-primary/80",
    "text-primary-foreground font-semibold",
    "shadow-lg shadow-primary/25",
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent",
    "hover:shadow-xl hover:shadow-primary/30"
  ),
  
  // Active menu button - Client Portal (Amber)
  menuButtonActiveClient: cn(
    "bg-gradient-to-r from-[hsl(var(--portal-client))] to-[hsl(var(--portal-client-glow))]",
    "text-background font-semibold",
    "shadow-lg shadow-[hsl(var(--portal-client)/0.3)]",
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent",
    "hover:shadow-xl hover:shadow-[hsl(var(--portal-client)/0.4)]"
  ),
  
  // Active menu button - Field Portal (Emerald)
  menuButtonActiveField: cn(
    "bg-gradient-to-r from-[hsl(var(--portal-field))] to-[hsl(var(--portal-field-glow))]",
    "text-background font-semibold",
    "shadow-lg shadow-[hsl(var(--portal-field)/0.3)]",
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent",
    "hover:shadow-xl hover:shadow-[hsl(var(--portal-field)/0.4)]"
  ),
  
  // Menu icon styling - visible icons
  menuIcon: "w-4 h-4 shrink-0 transition-colors duration-200 text-white/80",
  menuIconActive: "text-sidebar-primary-foreground",
  
  // Active indicator chevron
  activeIndicator: "ml-auto w-4 h-4 text-sidebar-primary-foreground/80",
  
  // Badge styling
  badge: "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
  badgeDestructive: "bg-destructive text-destructive-foreground animate-pulse shadow-sm",
  badgePrimary: "bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30",
  badgeWarning: "bg-alert-caution/20 text-alert-caution border border-alert-caution/30",
  
  // Footer styling
  footer: "border-t border-sidebar-border bg-sidebar/50 p-2",
  
  // Logout button
  logoutButton: cn(
    "text-destructive/80 hover:text-destructive",
    "hover:bg-destructive/10",
    "transition-all duration-200"
  ),
  
  // External link button (e.g., WhatsApp channel)
  externalLink: cn(
    "bg-alert-normal/10 hover:bg-alert-normal/20",
    "text-alert-normal border border-alert-normal/30",
    "hover:border-alert-normal/50",
    "transition-all duration-200"
  ),
  
  // Scrollbar styling (as CSS string for inline styles)
  scrollbarCSS: `
    .sidebar-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .sidebar-scrollbar::-webkit-scrollbar-thumb {
      background: hsl(var(--primary) / 0.3);
      border-radius: 4px;
    }
    .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--primary) / 0.5);
    }
    .sidebar-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: hsl(var(--primary) / 0.3) transparent;
    }
  `,
};

// Portal-specific accent colors for consistency
export const portalColors = {
  management: {
    gradient: "from-primary to-primary/80",
    accent: "text-primary",
    glow: "shadow-primary/20",
    bg: "bg-primary",
  },
  field: {
    gradient: "from-[hsl(var(--portal-field))] to-[hsl(var(--portal-field-glow))]",
    accent: "text-[hsl(var(--portal-field))]",
    glow: "shadow-[hsl(var(--portal-field)/0.2)]",
    bg: "bg-[hsl(var(--portal-field))]",
  },
  client: {
    gradient: "from-[hsl(var(--portal-client))] to-[hsl(var(--portal-client-glow))]",
    accent: "text-[hsl(var(--portal-client))]",
    glow: "shadow-[hsl(var(--portal-client)/0.2)]",
    bg: "bg-[hsl(var(--portal-client))]",
  },
};

// Live status indicator component - used across all portals
export const LiveStatusIndicator = ({ isLive, size = "sm" }: { isLive: boolean; size?: "sm" | "md" }) => {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  
  return (
    <span className={cn("flex items-center gap-1.5", textSize)}>
      <span 
        className={cn(
          dotSize,
          "rounded-full transition-colors duration-300",
          isLive ? "bg-alert-normal animate-pulse shadow-[0_0_6px_hsl(var(--alert-normal))]" : "bg-muted-foreground"
        )} 
      />
      <span className="text-muted-foreground font-medium">
        {isLive ? "Live" : "Offline"}
      </span>
    </span>
  );
};
