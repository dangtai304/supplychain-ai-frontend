import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CornerDownLeft, Search, ShoppingCart, Sparkles } from "lucide-react";
import { agents, exceptionCategories, navGroups } from "@/lib/mock-data";
import { navIcons } from "@/lib/icons";
import { useDashboard } from "@/lib/store";
import type { NavId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  group: "Pages" | "Agents" | "Orders" | "Ask AI";
  label: string;
  hint?: string;
  run: () => void;
  icon: React.ReactNode;
}

/** Global Ctrl/⌘ + K search across pages, agents and orders; falls back to asking the copilot. */
export function CommandPalette() {
  const { paletteOpen, setPalette, setNav, setCopilot, sendMessage, toggleException, expandedException } = useDashboard();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useDashboard.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette]);

  useEffect(() => {
    if (paletteOpen) {
      returnFocus.current = document.activeElement as HTMLElement;
      setQ("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      returnFocus.current?.focus?.();
    }
  }, [paletteOpen]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const close = () => setPalette(false);
    const pages: Result[] = navGroups
      .flatMap((g) => g.items)
      .map((i) => {
        const Icon = navIcons[i.id as NavId];
        return {
          id: `nav-${i.id}`,
          group: "Pages" as const,
          label: i.label,
          icon: <Icon size={16} />,
          run: () => {
            if (i.id === "ask") setCopilot("docked");
            else setNav(i.id);
            close();
          },
        };
      });
    const agentResults: Result[] = agents.map((a) => ({
      id: `agent-${a.id}`,
      group: "Agents",
      label: a.name,
      hint: a.scope,
      icon: <Bot size={16} />,
      run: () => {
        setNav("agents");
        close();
      },
    }));
    const orders: Result[] = exceptionCategories.flatMap((c) =>
      c.orders.map((o) => ({
        id: `order-${o.orderId}`,
        group: "Orders" as const,
        label: o.orderId,
        hint: `${o.customer}, ${c.label}`,
        icon: <ShoppingCart size={16} />,
        run: () => {
          setNav("home");
          useDashboard.getState().setShowAllExceptions(true);
          if (expandedException !== c.id) toggleException(c.id);
          close();
          requestAnimationFrame(() => document.getElementById(`exc-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
        },
      })),
    );
    const all = [...pages, ...agentResults, ...orders];
    const filtered = term ? all.filter((r) => `${r.label} ${r.hint ?? ""}`.toLowerCase().includes(term)) : [...pages.slice(0, 6), ...agentResults.slice(0, 3)];
    if (term) {
      filtered.push({
        id: "ask",
        group: "Ask AI",
        label: `Ask the copilot: "${q.trim()}"`,
        icon: <Sparkles size={16} />,
        run: () => {
          setCopilot("docked");
          sendMessage(q.trim());
          close();
        },
      });
    }
    return filtered.slice(0, 12);
  }, [q, setNav, setCopilot, sendMessage, setPalette, toggleException, expandedException]);

  if (!paletteOpen) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setPalette(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[cursor]?.run();
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/40" onClick={() => setPalette(false)} />
      <div className="relative w-full max-w-lg animate-fade-up overflow-hidden rounded-card border border-line bg-surface shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search size={16} className="text-subtle" aria-hidden="true" />
          <label htmlFor="palette-input" className="sr-only">
            Search pages, agents and orders
          </label>
          <input
            id="palette-input"
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            placeholder="Search pages, agents, orders (e.g. SO-45821)"
            className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-subtle"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[cursor]?.id}
          />
          <kbd className="rounded border border-line px-1.5 text-badge text-subtle">Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-body text-subtle">No matches. Try an order number like SO-45876.</li>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <li key={r.id} role="presentation">
                {header && <p className="px-2 pb-1 pt-2 text-badge text-subtle">{r.group}</p>}
                <button
                  type="button"
                  id={r.id}
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={r.run}
                  className={cn("flex w-full items-center gap-2.5 rounded-btn px-2 py-2 text-left text-body", i === cursor ? "bg-brand-soft text-fg" : "text-muted")}
                >
                  <span className="text-subtle">{r.icon}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-fg">{r.label}</span>
                    {r.hint && <span className="text-subtle">, {r.hint}</span>}
                  </span>
                  {i === cursor && <CornerDownLeft size={14} className="text-subtle" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
