// Black Hawk SOC-OS App Shell — workspace-based navigation.
// Compose `<WorkspaceShell>` around routed content.
export { WorkspaceShell } from "./WorkspaceShell";
export { IconRail } from "./IconRail";
export { ContextualSidebar } from "./ContextualSidebar";
export { AppHeader } from "./AppHeader";
export {
  workspaces,
  workspaceForPath,
  allModules,
  type Workspace,
  type NavSection,
  type NavModule,
} from "./workspaceConfig";
