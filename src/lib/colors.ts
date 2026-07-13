/**
 * Semantic Color System
 * 
 * This module provides consistent, design-token-based color mappings
 * for use across the entire application. All colors reference CSS variables
 * defined in index.css and tailwind.config.ts.
 * 
 * USAGE: Import and use these utilities instead of hardcoded Tailwind colors.
 */

// =============================================================================
// STATUS COLORS - For entity/record states
// =============================================================================

export type StatusType = 
  | 'active' | 'available' | 'online' | 'complete' | 'completed' | 'resolved' | 'verified' | 'success' | 'approved' | 'met'
  | 'pending' | 'in_progress' | 'processing' | 'on_patrol' | 'assigned' | 'scheduled'
  | 'warning' | 'caution' | 'delayed' | 'exception' | 'incomplete' | 'at_risk' | 'expiring'
  | 'critical' | 'error' | 'failed' | 'breached' | 'emergency' | 'cancelled' | 'rejected' | 'missed'
  | 'inactive' | 'off_duty' | 'offline' | 'closed' | 'default';

export const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  // Success/Active states - Use alert-normal (green)
  active: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  available: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  online: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  complete: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  completed: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  resolved: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  verified: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  success: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  approved: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  met: { bg: 'bg-alert-normal/10', text: 'text-alert-normal', border: 'border-alert-normal/30' },

  // In-progress/Processing states - Use primary (cyan)
  pending: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  in_progress: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  processing: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  on_patrol: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  assigned: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  scheduled: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },

  // Warning/Caution states - Use alert-caution (amber/orange)
  warning: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  caution: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  delayed: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  exception: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  incomplete: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  at_risk: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  expiring: { bg: 'bg-alert-caution/10', text: 'text-alert-caution', border: 'border-alert-caution/30' },

  // Critical/Error states - Use alert-critical (red)
  critical: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  error: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  failed: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  breached: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  emergency: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  cancelled: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  rejected: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  missed: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/30' },

  // Inactive/Neutral states - Use muted
  inactive: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  off_duty: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  offline: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  closed: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  default: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
};

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_') as StatusType;
  return statusColors[normalized] || statusColors.default;
}

export function getStatusClasses(status: string, includeAll = true): string {
  const colors = getStatusColor(status);
  if (includeAll) {
    return `${colors.bg} ${colors.text} ${colors.border}`;
  }
  return colors.bg;
}

// =============================================================================
// PRIORITY COLORS - For urgency levels
// =============================================================================

export type PriorityType = 'critical' | 'high' | 'medium' | 'low' | 'normal' | 'default';

export const priorityColors: Record<PriorityType, { bg: string; text: string; border: string; icon: string }> = {
  critical: { bg: 'bg-alert-critical/15', text: 'text-alert-critical', border: 'border-alert-critical/30', icon: 'text-alert-critical' },
  high: { bg: 'bg-alert-caution/15', text: 'text-alert-caution', border: 'border-alert-caution/30', icon: 'text-alert-caution' },
  medium: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30', icon: 'text-primary' },
  low: { bg: 'bg-alert-normal/15', text: 'text-alert-normal', border: 'border-alert-normal/30', icon: 'text-alert-normal' },
  normal: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', icon: 'text-muted-foreground' },
  default: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', icon: 'text-muted-foreground' },
};

export function getPriorityColor(priority: string): { bg: string; text: string; border: string; icon: string } {
  const normalized = priority.toLowerCase() as PriorityType;
  return priorityColors[normalized] || priorityColors.default;
}

export function getPriorityClasses(priority: string): string {
  const colors = getPriorityColor(priority);
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

// =============================================================================
// SEVERITY COLORS - For risk/threat levels
// =============================================================================

export type SeverityType = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'default';

export const severityColors: Record<SeverityType, { bg: string; text: string; border: string; shadow: string }> = {
  critical: { 
    bg: 'bg-alert-critical/15', 
    text: 'text-alert-critical', 
    border: 'border-alert-critical', 
    shadow: 'shadow-[0_0_30px_hsl(var(--alert-critical)/0.2)]' 
  },
  high: { 
    bg: 'bg-alert-caution/15', 
    text: 'text-alert-caution', 
    border: 'border-alert-caution', 
    shadow: 'shadow-[0_0_30px_hsl(var(--alert-caution)/0.2)]' 
  },
  medium: { 
    bg: 'bg-primary/15', 
    text: 'text-primary', 
    border: 'border-primary', 
    shadow: 'shadow-[0_0_30px_hsl(var(--primary)/0.2)]' 
  },
  low: { 
    bg: 'bg-alert-normal/15', 
    text: 'text-alert-normal', 
    border: 'border-alert-normal', 
    shadow: 'shadow-[0_0_30px_hsl(var(--alert-normal)/0.2)]' 
  },
  info: { 
    bg: 'bg-secondary/50', 
    text: 'text-foreground', 
    border: 'border-border', 
    shadow: '' 
  },
  default: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    border: 'border-muted', 
    shadow: '' 
  },
};

export function getSeverityColor(severity: string): { bg: string; text: string; border: string; shadow: string } {
  const normalized = severity.toLowerCase() as SeverityType;
  return severityColors[normalized] || severityColors.default;
}

// =============================================================================
// CATEGORY COLORS - For module/type differentiation
// =============================================================================

export type CategoryType = 
  | 'security' | 'patrol' | 'alarm' | 'incident' 
  | 'training' | 'document' | 'interactive' | 'video' | 'quiz'
  | 'technical' | 'maintenance' | 'equipment'
  | 'communication' | 'report' | 'analytics'
  | 'user' | 'staff' | 'client'
  | 'default';

export const categoryColors: Record<CategoryType, { bg: string; text: string; border: string }> = {
  // Security operations - Primary cyan
  security: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  patrol: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  alarm: { bg: 'bg-alert-critical/15', text: 'text-alert-critical', border: 'border-alert-critical/30' },
  incident: { bg: 'bg-alert-caution/15', text: 'text-alert-caution', border: 'border-alert-caution/30' },

  // Training/Learning - Using secondary accents
  training: { bg: 'bg-accent/30', text: 'text-accent-foreground', border: 'border-accent' },
  document: { bg: 'bg-alert-caution/15', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  interactive: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  video: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  quiz: { bg: 'bg-alert-normal/15', text: 'text-alert-normal', border: 'border-alert-normal/30' },

  // Technical operations
  technical: { bg: 'bg-secondary/50', text: 'text-secondary-foreground', border: 'border-secondary' },
  maintenance: { bg: 'bg-alert-caution/15', text: 'text-alert-caution', border: 'border-alert-caution/30' },
  equipment: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },

  // Communication/Admin
  communication: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  report: { bg: 'bg-alert-normal/15', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  analytics: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },

  // People
  user: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  staff: { bg: 'bg-alert-normal/15', text: 'text-alert-normal', border: 'border-alert-normal/30' },
  client: { bg: 'bg-[hsl(var(--portal-client))]/15', text: 'text-[hsl(var(--portal-client))]', border: 'border-[hsl(var(--portal-client))]/30' },

  default: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
};

export function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  const normalized = category.toLowerCase().replace(/[\s-]/g, '_') as CategoryType;
  return categoryColors[normalized] || categoryColors.default;
}

// =============================================================================
// STATS CARD COLORS - For dashboard metrics
// =============================================================================

export type StatsStatus = 'normal' | 'caution' | 'critical';

export const statsCardColors: Record<StatsStatus, { card: string; icon: string }> = {
  normal: {
    card: 'border-alert-normal bg-alert-normal/15 shadow-[0_0_30px_hsl(var(--alert-normal)/0.2)]',
    icon: 'bg-alert-normal/30 text-alert-normal shadow-[0_0_20px_hsl(var(--alert-normal)/0.15)]',
  },
  caution: {
    card: 'border-alert-caution bg-alert-caution/15 shadow-[0_0_30px_hsl(var(--alert-caution)/0.2)]',
    icon: 'bg-alert-caution/30 text-alert-caution shadow-[0_0_20px_hsl(var(--alert-caution)/0.15)]',
  },
  critical: {
    card: 'border-alert-critical bg-alert-critical/15 shadow-[0_0_30px_hsl(var(--alert-critical)/0.2)]',
    icon: 'bg-alert-critical/30 text-alert-critical shadow-[0_0_20px_hsl(var(--alert-critical)/0.15)]',
  },
};

// =============================================================================
// SLA COLORS - For time-based compliance
// =============================================================================

export function getSLAColor(minutesToDeadline: number, isResolved: boolean): { bg: string; text: string; border: string } {
  if (isResolved) {
    return minutesToDeadline >= 0 
      ? statusColors.met 
      : statusColors.breached;
  }
  
  if (minutesToDeadline < 0) return statusColors.breached;
  if (minutesToDeadline <= 3) return statusColors.at_risk;
  return statusColors.active;
}

// =============================================================================
// MODE STATE COLORS - For system modes
// =============================================================================

export const modeStateColors: Record<string, string> = {
  enabled: 'bg-alert-normal',
  offline: 'bg-alert-caution',
  maintenance: 'bg-alert-critical',
  demo: 'bg-primary',
};

// =============================================================================
// VEHICLE/UNIT STATUS COLORS
// =============================================================================

export const vehicleStatusColors: Record<string, string> = {
  available: 'bg-alert-normal',
  on_patrol: 'bg-primary',
  responding: 'bg-alert-caution',
  emergency: 'bg-alert-critical animate-pulse',
  off_duty: 'bg-muted',
};

// =============================================================================
// BADGE COMPONENT HELPER
// =============================================================================

export function getBadgeClasses(
  variant: 'status' | 'priority' | 'severity' | 'category',
  value: string
): string {
  switch (variant) {
    case 'status':
      return getStatusClasses(value);
    case 'priority':
      return getPriorityClasses(value);
    case 'severity': {
      const s = getSeverityColor(value);
      return `${s.bg} ${s.text} ${s.border}`;
    }
    case 'category': {
      const c = getCategoryColor(value);
      return `${c.bg} ${c.text} ${c.border}`;
    }
    default:
      return '';
  }
}
