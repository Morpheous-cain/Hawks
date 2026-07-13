import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { PlatformDefinition } from "./platformRegistry";

/**
 * PlatformWelcome — universal welcome screen pattern.
 * Hero greets the user, KPI strip, quick actions, recent module shortcuts.
 */
interface Props { platform: PlatformDefinition }

export const PlatformWelcome = ({ platform }: Props) => {
  const { user } = useAuth();
  const Icon = platform.icon;
  const firstName = (user?.email ?? "Operator").split("@")[0].split(".")[0]
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface-1 p-8 md:p-10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at top right, black 10%, transparent 70%)",
          }}
        />
        <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${platform.gradient} opacity-15 blur-3xl`} />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${platform.gradient} shadow-lg shrink-0`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-text-muted">
              <Sparkles className="h-3 w-3 text-primary" />
              {platform.eyebrow}
            </div>
            <h1
              className="mt-2 text-3xl md:text-4xl tracking-[-0.015em] text-foreground"
              style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
            >
              Welcome, <em className="italic text-muted-foreground">{firstName}</em>
            </h1>
            <p className="mt-2 text-sm text-text-muted md:text-base">
              You are signed in to the <span className="font-medium text-foreground">{platform.name}</span> platform.
            </p>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">{platform.mission}</p>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-px md:grid-cols-4 bg-border border border-border rounded-xl overflow-hidden">
        {platform.kpis.map((k) => (
          <div key={k.label} className="bg-card p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">{k.label}</div>
            <div
              className="mt-2 text-2xl tabular-nums text-foreground"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {k.value}
            </div>
            {k.hint && <div className="mt-1 text-xs text-text-dim">{k.hint}</div>}
          </div>
        ))}
      </section>

      {/* Quick actions + Modules */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-2xs font-bold uppercase tracking-[0.2em] text-text-muted">Quick Actions</h2>
          <div className="space-y-2">
            {platform.quickActions.map((a) => (
              <Button key={a.to} asChild variant="outline" className="w-full justify-between">
                <Link to={a.to}>
                  {a.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-2xs font-bold uppercase tracking-[0.2em] text-text-muted">Your Modules</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {platform.modules.filter((m) => m.name !== "Welcome").map((m) => {
              const M = m.icon;
              return (
                <Link key={m.to} to={m.to}>
                  <div className="group flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/40 hover:bg-surface-2">
                    <M className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{m.name}</div>
                      {m.desc && <div className="truncate text-xs text-text-muted">{m.desc}</div>}
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default PlatformWelcome;
