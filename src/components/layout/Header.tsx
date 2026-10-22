import { useEffect, useState } from "react";
import { Bell, Lock, LogOut, Menu, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";

type ThemePref = "system" | "light" | "dark";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} ${time}`;
}

function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", pref);
  }, [pref]);
  const next: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <IconButton label={`Theme: ${pref}. Switch to ${next[pref]}`} onClick={() => setPref(next[pref])}>
      <Icon size={17} />
    </IconButton>
  );
}

function LiveBadge({ status }: { status: "connecting" | "online" | "demo" }) {
  if (status === "online")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2 py-0.5 text-badge text-ok" title="Connected to the SupplyChain AI API">
        <StatusDot tone="ok" pulse /> Live data
      </span>
    );
  if (status === "connecting")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2 py-0.5 text-badge text-info" title="The API can take up to a minute to wake up">
        <StatusDot tone="info" pulse /> Connecting
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2 py-0.5 text-badge text-warn" title="API not reachable, showing bundled demo data">
      <StatusDot tone="warn" /> Demo data
    </span>
  );
}

const roleNames: Record<string, string> = {
  admin: "Administrator",
  scm: "Supply Chain Manager",
  inventory: "Inventory Planner",
  procurement: "Procurement Manager",
  logistics: "Logistics Manager",
  oms: "OMS Manager",
  finance: "Finance",
  executive: "Executive",
};

function UserMenu() {
  const me = useDashboard((s) => s.me);
  const [open, setOpen] = useState(false);
  const name = me?.email ? me.email.split("@")[0] : currentUser.firstName;
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest("[data-user-menu]")) setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("mousedown", close);
    };
  }, [open]);

  return (
    <div className="relative" data-user-menu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${me?.email ?? name}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-label uppercase text-brand-strong hover:ring-2 hover:ring-brand/30"
      >
        {name[0]}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-40 w-64 animate-fade-up rounded-card border border-line bg-surface p-2 shadow-xl">
          <div className="px-2 py-1.5">
            <p className="truncate text-body font-semibold text-fg">{me?.email ?? "Demo user"}</p>
            <p className="text-badge font-normal text-subtle">{me ? roleNames[me.role] : "Demo mode, no sign-in"}</p>
          </div>
          {me && (
            <p className="mx-2 mb-1 rounded-btn bg-surface-2 px-2 py-1.5 text-badge font-normal text-muted">
              {me.actionScope === "all" ? "Can act on every exception type." : me.actionScope.length === 0 ? "View only. Can't approve exceptions." : `Can act on ${me.actionScope.length} exception type${me.actionScope.length > 1 ? "s" : ""}.`}
            </p>
          )}
          {supabase && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void supabase!.auth.signOut()}
              className="flex w-full items-center gap-2 rounded-btn px-2 py-2 text-left text-body text-fg hover:bg-surface-2"
            >
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Top command bar plus welcome banner and persona role switcher. */
export function Header({ title }: { title: string }) {
  const { role, setRole, setMobileNav, copilot, setCopilot, apiStatus, me } = useDashboard();
  const canSwitch = useDashboard((s) => s.canSwitchView());
  const allRoles = useDashboard((s) => s.data.roles);
  const roles = canSwitch ? allRoles : allRoles.filter((r) => r.id === role);
  const firstName = me?.email ? me.email.split("@")[0].split(/[._-]/)[0] : currentUser.firstName;
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const stamp = useClock();

  return (
    <>
      {/* Command bar */}
      <div
        className="sticky z-30 border-b border-line bg-surface/95 backdrop-blur"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-14 items-center gap-2 px-4 md:px-6">
          <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNav(true)}>
            <Menu size={18} />
          </IconButton>
          <p className="min-w-0 flex-1 truncate text-card-title text-fg">{title}</p>
          <div className="hidden items-center gap-3 text-label font-normal text-subtle sm:flex">
            <span className="tnum">{stamp}</span>
            <LiveBadge status={apiStatus} />
          </div>
          <ThemeToggle />
          <IconButton label="Notifications, 16 approvals waiting" className="relative">
            <Bell size={17} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-bad ring-2 ring-surface" aria-hidden="true" />
          </IconButton>
          {(copilot === "closed" || copilot === "minimized") && (
            <button
              type="button"
              onClick={() => setCopilot("docked")}
              className="hidden h-8 items-center gap-1.5 rounded-btn bg-brand px-3 text-body font-semibold text-white hover:opacity-90 sm:inline-flex"
            >
              <Sparkles size={15} aria-hidden="true" /> Ask AI
            </button>
          )}
          <UserMenu />
        </div>
      </div>

      {/* Welcome + role switcher */}
      <div className="px-4 pt-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-title text-fg" style={{ textWrap: "balance" }}>
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-body text-subtle">Your role-based AI agents are monitoring the entire supply chain and taking actions.</p>
          </div>
          <div className="flex items-center gap-2 text-label font-normal text-subtle sm:hidden">
            <LiveBadge status={apiStatus} /> <span className="tnum">{stamp}</span>
          </div>
        </div>

        <div role="radiogroup" aria-label="View as role" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {roles.map((r) => {
            const active = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(r.id)}
                className={cn(
                  "h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-body transition-colors",
                  active ? "border-brand bg-brand font-semibold text-white" : "border-line bg-surface text-muted hover:border-brand/50 hover:text-fg",
                )}
              >
                {!canSwitch && <Lock size={12} className="mr-1 inline -translate-y-px" aria-hidden="true" />}
                {r.label}
              </button>
            );
          })}
          {!canSwitch && <span className="self-center whitespace-nowrap text-badge font-normal text-subtle">Your role's view</span>}
        </div>
      </div>
    </>
  );
}
