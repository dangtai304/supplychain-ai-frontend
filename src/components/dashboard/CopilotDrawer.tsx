import { useEffect, useRef, useState } from "react";
import { Maximize2, Mic, Minimize2, Minus, Paperclip, SendHorizontal, Sparkles, X } from "lucide-react";
import type { ChatBlock, ChatMessage, RiskTag, Tone } from "@/lib/types";
import { contextChips } from "@/lib/mock-data";
import { useDashboard } from "@/lib/store";
import { cn, toneColor, toneSoft } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";

const tagTone: Record<RiskTag, Tone> = {
  "Port congestion": "bad",
  "Out of stock": "orange",
  "Weather delay": "warn",
  "Address validation": "info",
  "Carrier capacity": "purple",
};

function Block({ block, onAction, disabled }: { block: ChatBlock; onAction: (a: string) => void; disabled: boolean }) {
  switch (block.kind) {
    case "text":
      return <p className="text-body">{block.text}</p>;
    case "bullets":
      return (
        <ul className="list-disc space-y-1 pl-4 text-body marker:text-subtle">
          {block.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case "riskOrders":
      return (
        <ol className="space-y-1.5">
          {block.orders.map((o) => (
            <li key={o.orderId} className="rounded-input border border-line bg-surface p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-label text-fg">{o.orderId}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-badge", toneSoft[tagTone[o.tag]])}>{o.tag}</span>
              </div>
              <p className="mt-1 text-badge font-normal text-muted">
                {o.customer}: {o.detail}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <span className="block h-full rounded-full" style={{ width: `${o.riskScore}%`, background: toneColor(o.riskScore >= 85 ? "bad" : "warn") }} />
                </span>
                <span className="tnum text-badge text-subtle">Risk {o.riskScore}</span>
              </div>
            </li>
          ))}
        </ol>
      );
    case "actions":
      return (
        <div className="flex flex-wrap gap-1.5">
          {block.actions.map((a) => (
            <button
              key={a}
              type="button"
              disabled={disabled}
              onClick={() => onAction(a)}
              className="rounded-full border border-brand/40 bg-surface px-2.5 py-1 text-label text-brand transition-colors hover:bg-brand-soft disabled:opacity-50"
            >
              {a}
            </button>
          ))}
        </div>
      );
  }
}

function Message({ m, onAction, disabled }: { m: ChatMessage; onAction: (a: string) => void; disabled: boolean }) {
  const mine = m.from === "user";
  return (
    <li className={cn("flex animate-fade-up flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div className={cn("max-w-[92%] space-y-2 rounded-card px-3 py-2.5", mine ? "rounded-br-btn bg-brand text-white" : "rounded-bl-btn bg-surface-2 text-fg")}>
        {m.blocks.map((b, i) => (
          <Block key={i} block={b} onAction={onAction} disabled={disabled} />
        ))}
      </div>
      <span className="px-1 text-[10px] text-subtle">{m.time}</span>
    </li>
  );
}

/** Right-hand AI copilot. Docked column on wide screens, slide-over below xl, fullscreen or minimized on demand. */
export function CopilotDrawer() {
  const { copilot, setCopilot, messages, sendMessage, agentTyping, copilotSource, notice: storeNotice, setNotice } = useDashboard();
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const feedRef = useRef<HTMLOListElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, agentTyping, copilot]);

  useEffect(() => {
    if (storeNotice) {
      setNote(storeNotice);
      setNotice(null);
    }
  }, [storeNotice, setNotice]);

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 5000);
    return () => window.clearTimeout(t);
  }, [note]);

  if (copilot === "closed") return null;

  if (copilot === "minimized") {
    return (
      <button
        type="button"
        onClick={() => setCopilot("docked")}
        className="fixed z-40 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-4 text-body font-semibold text-white shadow-xl hover:opacity-95"
        style={{ right: "calc(16px + env(safe-area-inset-right, 0px))", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        aria-label="Open Supply Chain AI Assistant"
      >
        <Sparkles size={18} aria-hidden="true" /> Ask AI
        <span className="relative ml-0.5 inline-flex">
          <StatusDot tone="ok" pulse />
        </span>
      </button>
    );
  }

  const submit = () => {
    const text = [draft.trim(), attachment ? `(attached ${attachment})` : ""].filter(Boolean).join(" ");
    if (!text) return;
    sendMessage(text);
    setDraft("");
    setAttachment(null);
    inputRef.current?.focus();
  };

  const startVoice = () => {
    type SR = { lang: string; interimResults: boolean; start: () => void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onerror: () => void; onend: () => void };
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setNote("Voice input isn't supported in this browser. Type your question instead.");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e) => setDraft((d) => `${d}${d ? " " : ""}${e.results[0][0].transcript}`);
      rec.onerror = () => setNote("Microphone access was blocked. Type your question instead.");
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setNote("Microphone access was blocked. Type your question instead.");
    }
  };

  const full = copilot === "fullscreen";

  return (
    <>
      {/* Backdrop for slide-over (below xl) and fullscreen */}
      <button
        type="button"
        aria-label="Close assistant"
        onClick={() => setCopilot("minimized")}
        className={cn("fixed inset-0 z-40 bg-black/40", full ? "block" : "xl:hidden")}
      />
      <aside
        aria-label="Supply Chain AI Assistant"
        className={cn(
          "z-50 flex flex-col border-line bg-surface",
          full
            ? "fixed inset-3 animate-fade-up rounded-card border shadow-2xl md:inset-8"
            : "fixed inset-y-0 right-0 w-full max-w-[400px] animate-slide-in border-l shadow-2xl xl:sticky xl:top-0 xl:h-screen xl:w-[360px] xl:max-w-none xl:shrink-0 xl:animate-none xl:shadow-none",
        )}
        style={full ? undefined : { paddingTop: "env(safe-area-inset-top, 0px)", paddingRight: "env(safe-area-inset-right, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-input bg-brand text-white">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-card-title text-fg">Supply Chain AI Assistant</p>
            <p className="inline-flex items-center gap-1.5 text-badge text-ok">
              <StatusDot tone="ok" pulse /> {copilotSource === "claude" ? "Online, powered by Claude" : copilotSource === "canned" ? "Online, scripted replies" : "Offline demo"}
            </p>
          </div>
          <IconButton label="Minimize" onClick={() => setCopilot("minimized")}>
            <Minus size={16} />
          </IconButton>
          <IconButton label={full ? "Exit fullscreen" : "Fullscreen"} onClick={() => setCopilot(full ? "docked" : "fullscreen")} className="hidden sm:inline-flex">
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>
          <IconButton label="Close assistant" onClick={() => setCopilot("closed")}>
            <X size={16} />
          </IconButton>
        </header>

        {/* Feed */}
        <ol ref={feedRef} className={cn("scroll-thin flex-1 space-y-4 overflow-y-auto px-3 py-4", full && "mx-auto w-full max-w-3xl")} aria-live="polite">
          {messages.map((m) => (
            <Message key={m.id} m={m} onAction={sendMessage} disabled={agentTyping} />
          ))}
          {agentTyping && (
            <li className="flex items-center gap-1.5 px-1 text-badge font-normal text-subtle" aria-label="Assistant is typing">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
              Analyzing across 8 agents
            </li>
          )}
        </ol>

        {/* Composer */}
        <div className={cn("shrink-0 border-t border-line p-3", full && "mx-auto w-full max-w-3xl")}>
          <div className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
            {contextChips.map((c) => (
              <button
                key={c}
                type="button"
                disabled={agentTyping}
                onClick={() => sendMessage(`Give me a ${c.toLowerCase()} update`)}
                className="shrink-0 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-label text-muted hover:border-brand/50 hover:text-fg disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>

          {note && (
            <p role="status" className="mb-2 rounded-btn bg-warn/10 px-2.5 py-1.5 text-badge text-warn">
              {note}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="rounded-input border border-line bg-surface focus-within:border-brand"
          >
            {attachment && (
              <div className="flex items-center gap-1.5 px-3 pt-2">
                <span className="inline-flex max-w-full items-center gap-1 truncate rounded-btn bg-surface-2 px-2 py-0.5 text-badge text-muted">
                  <Paperclip size={12} aria-hidden="true" /> {attachment}
                  <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)} className="ml-0.5 text-subtle hover:text-fg">
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}
            <label htmlFor="copilot-input" className="sr-only">
              Ask about orders, inventory, suppliers and more
            </label>
            <textarea
              id="copilot-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={listening ? "Listening…" : "Ask anything about your supply chain"}
              className="block max-h-32 min-h-[40px] w-full resize-none bg-transparent px-3 pt-2.5 text-body text-fg outline-none placeholder:text-subtle"
            />
            <div className="flex items-center gap-1 px-1.5 pb-1.5">
              <input
                id="copilot-file"
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setAttachment(f.name);
                  e.target.value = "";
                }}
              />
              <IconButton label="Attach a file" onClick={() => fileRef.current?.click()}>
                <Paperclip size={16} />
              </IconButton>
              <IconButton label={listening ? "Listening" : "Voice input"} onClick={startVoice} className={cn(listening && "bg-bad/10 text-bad")}>
                <Mic size={16} />
              </IconButton>
              <span className="flex-1" />
              <button
                type="submit"
                aria-label="Send"
                title="Send"
                disabled={agentTyping || (!draft.trim() && !attachment)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-btn bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <SendHorizontal size={16} />
              </button>
            </div>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-subtle">Agents act on approved policies. High-impact actions need your approval.</p>
        </div>
      </aside>
    </>
  );
}
