// Thin client for the SupplyChain AI backend (Render). VITE_API_URL is set in Vercel.
// When it's missing or unreachable the UI keeps working on the bundled mock data.
import type { Agent, ChatBlock, ChatMessage, ExceptionCategory, ExceptionId, Kpi, KpiId, NetworkNode, OmsMetric, Role, RoleId, Shipment, StatusSegment, VolumePoint, WorkflowStage } from "./types";
import { accessToken } from "./supabase";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface DashboardData {
  roles: Role[];
  kpis: Record<KpiId, Kpi>;
  workflowStages: WorkflowStage[];
  omsMetrics: OmsMetric[];
  statusDistribution: StatusSegment[];
  exceptionCategories: ExceptionCategory[];
  network: { nodes: NetworkNode[]; shipments: Shipment[] };
  volumeTrend: VolumePoint[];
  agents: Agent[];
  resolved: Record<string, "approved" | "assigned">;
}

/** The signed-in user's identity and permissions, from GET /api/me. */
export interface Me {
  id: string;
  email: string;
  role: "admin" | RoleId;
  defaultView: RoleId;
  canSwitchView: boolean;
  actionScope: ExceptionId[] | "all";
  canResetDemo: boolean;
  auth: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

/** Called on 401 so the app can drop back to the sign-in screen. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

async function call<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  if (!API_URL) throw new Error("No API configured");
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 15000);
  try {
    const token = await accessToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (res.status === 401) onUnauthorized?.();
      throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.code);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  } finally {
    window.clearTimeout(t);
  }
}

/** Stable per-browser chat session id. */
export const sessionId: string = (() => {
  const make = () => `s-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  try {
    const existing = localStorage.getItem("scai-session");
    if (existing) return existing;
    const id = make();
    localStorage.setItem("scai-session", id);
    return id;
  } catch {
    return make();
  }
})();

// Render's free plan sleeps when idle; the first request can take ~50s while it wakes.
export const api = {
  me: () => call<Me>("/api/me", { timeoutMs: 70000 }),
  dashboard: () => call<DashboardData>("/api/dashboard", { timeoutMs: 70000 }),
  setAction: (orderId: string, action: "approved" | "assigned") =>
    call<{ orderId: string; action: string }>(`/api/exceptions/${encodeURIComponent(orderId)}/actions`, { method: "POST", body: JSON.stringify({ action }) }),
  chat: () => call<{ messages: ChatMessage[]; copilot: "claude" | "canned" }>(`/api/chat?session=${sessionId}`, { timeoutMs: 70000 }),
  send: (text: string, role: string) =>
    call<{ user: ChatMessage; reply: ChatMessage; source: "claude" | "canned" }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ session: sessionId, text, role }),
      timeoutMs: 60000,
    }),
};

export type { ChatBlock };
