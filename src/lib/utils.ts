import { clsx, type ClassValue } from "clsx";
import type { Tone } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

export const fmtInt = (n: number) => n.toLocaleString("en-US");
export const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
export const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

/** CSS color for a semantic tone, usable in SVG fill/stroke and inline styles. */
export const toneColor = (t: Tone, alpha = 1) => `rgb(var(--${t}) / ${alpha})`;

/** Tailwind class sets per tone (kept literal so Tailwind's JIT can see them). */
export const toneText: Record<Tone, string> = {
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
  info: "text-info",
  cyan: "text-cyan",
  purple: "text-purple",
  orange: "text-orange",
};
export const toneBg: Record<Tone, string> = {
  ok: "bg-ok",
  bad: "bg-bad",
  warn: "bg-warn",
  info: "bg-info",
  cyan: "bg-cyan",
  purple: "bg-purple",
  orange: "bg-orange",
};
export const toneSoft: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok",
  bad: "bg-bad/10 text-bad",
  warn: "bg-warn/10 text-warn",
  info: "bg-info/10 text-info",
  cyan: "bg-cyan/10 text-cyan",
  purple: "bg-purple/10 text-purple",
  orange: "bg-orange/10 text-orange",
};

/** Good/bad direction of a change given whether higher is better. */
export const changeTone = (changePct: number, higherIsBetter: boolean): Tone =>
  changePct === 0 ? "info" : changePct > 0 === higherIsBetter ? "ok" : "bad";
