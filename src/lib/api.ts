// Thin client for the SupplyChain AI backend (Render). VITE_API_URL is set in Vercel.
// When it's missing or unreachable the UI keeps working on the bundled mock data.
import type { Agent, ChatBlock, ChatMessage, ExceptionCategory, Kpi, KpiId, NetworkNode, OmsMetric, Role, Shipment, StatusSegment, VolumePoint, WorkflowStage } from "./types";

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

async function call<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  if (!API_URL) throw new Error("No API configured");
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 15000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
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
