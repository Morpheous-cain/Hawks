import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/black-hawk-logo.png";
import { workspaces, workspaceForPath, type Workspace } from "./workspaceConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * IconRail — 56px far-left workspace switcher.
 *
 * Always visible on desktop. Each workspace is one icon button.
 * Active workspace gets a 2px left accent bar in brand blue and
 * a slightly elevated surface — no gradient, no glow.
 */
export const IconRail = () => {
  const { pathname } = useLocation();
  const active = workspaceForPath(pathname);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label="Workspaces"
        className="hidden md:flex w-14 shrink-0 flex-col items-center justify-between border-r border-border bg-sidebar py-3"
      >
        {/* Brand mark */}
        <Link
          to="/"
          aria-label="Black Hawk home"
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card transition-colors hover:border-primary/40"
        >
          <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
        </Link>

        {/* Workspace stack */}
        <nav className="flex flex-1 flex-col items-center gap-1 pt-2">
          {workspaces.map((ws) => (
            <RailItem key={ws.id} workspace={ws} active={active.id === ws.id} />
          ))}
        </nav>

        {/* Tiny version mark — calm, almost invisible */}
        <div className="font-mono text-[9px] tracking-wider text-text-dim">v25</div>
      </aside>
    </TooltipProvider>
  );
};

const RailItem = ({ workspace, active }: { workspace: Workspace; active: boolean }) => {
  // First module of the workspace is the landing destination when switching.
  const landingPath = workspace.sections[0]?.modules[0]?.path ?? "/";
  const Icon = workspace.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={landingPath}
          aria-label={workspace.name}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150",
            active
              ? "bg-surface-2 text-foreground"
              : "text-text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          {active && (
            <span
              aria-hidden
              className="absolute -left-[7px] top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
            />
          )}
          <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        <div>{workspace.name}</div>
        <div className="text-2xs text-text-muted">{workspace.tagline}</div>
      </TooltipContent>
    </Tooltip>
  );
};

export default IconRail;
