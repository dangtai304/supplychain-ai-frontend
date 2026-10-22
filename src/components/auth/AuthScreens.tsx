import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Boxes, Eye, EyeOff, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { supabase, arrivedVia } from "@/lib/supabase";
import { setUnauthorizedHandler } from "@/lib/api";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ---------- shell ---------- */

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="flex flex-col justify-between gap-8 bg-nav px-6 py-8 text-nav-fg lg:w-[420px] lg:px-10 lg:py-12" style={{ paddingLeft: "max(24px, env(safe-area-inset-left, 0px))" }}>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-input bg-[rgb(var(--amber))] text-[#0f172a]">
            <Boxes size={20} strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div>
            <p className="text-card-title">SupplyChain AI</p>
            <p className="text-badge font-normal text-nav-muted">Agentic Operating System</p>
          </div>
        </div>
        <div className="hidden lg:block">
          <p className="text-[22px] font-semibold leading-8">One control tower for orders, inventory, suppliers and logistics.</p>
          <p className="mt-3 text-body text-nav-muted">Eight role-based agents watch the network and act within the limits your role allows. Access is by invitation.</p>
        </div>
        <p className="hidden items-center gap-2 text-badge font-normal text-nav-muted lg:flex">
          <ShieldCheck size={14} aria-hidden="true" /> Secured by Supabase Auth
        </p>
      </aside>
      <main className="flex flex-1 items-start justify-center bg-bg px-4 py-10 lg:items-center" style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, autoComplete, error, hint }: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string; error?: string | null; hint?: string }) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label htmlFor={id} className="block text-label text-fg">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPw && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(
            "h-10 w-full rounded-input border bg-surface px-3 text-[14px] text-fg outline-none transition-colors focus:border-brand",
            isPw && "pr-10",
            error ? "border-bad" : "border-line",
          )}
        />
        {isPw && (
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-subtle hover:text-fg">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-badge font-normal text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-badge font-normal text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-brand text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

const friendly = (msg: string) =>
  /invalid login credentials/i.test(msg)
    ? "That email and password don't match an account. Check both and try again."
    : /email not confirmed/i.test(msg)
      ? "Open the invitation email first to activate your account."
      : /rate limit|too many/i.test(msg)
        ? "Too many attempts. Wait a few minutes and try again."
        : msg;

/* ---------- screens ---------- */

function SignIn() {
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter your work email address.");
    setBusy(true);
    if (mode === "signin") {
      if (!password) {
        setBusy(false);
        return setError("Enter your password.");
      }
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setError(friendly(error.message));
    } else {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) setError(friendly(error.message));
      else setSent(true);
    }
    setBusy(false);
  };

  return (
    <AuthShell>
      <h1 className="text-title text-fg">{mode === "signin" ? "Sign in" : "Reset your password"}</h1>
      <p className="mt-1 text-body text-subtle">{mode === "signin" ? "Use the email your administrator invited." : "We'll email you a link to choose a new password."}</p>

      {sent ? (
        <div role="status" className="mt-6 rounded-input border border-line bg-surface p-4 text-body text-muted">
          If <span className="font-semibold text-fg">{email}</span> has an account, a reset link is on its way. Open it on this device.
          <button type="button" onClick={() => (setMode("signin"), setSent(false))} className="mt-3 block font-semibold text-brand hover:text-brand-strong">
            Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Field id="auth-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          {mode === "signin" && <Field id="auth-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />}
          {error && (
            <p role="alert" className="rounded-btn bg-bad/10 px-3 py-2 text-body text-bad">
              {error}
            </p>
          )}
          <SubmitButton busy={busy}>{mode === "signin" ? "Sign in" : "Send reset link"}</SubmitButton>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "reset" : "signin");
              setError(null);
            }}
            className="block w-full text-center text-body font-semibold text-brand hover:text-brand-strong"
          >
            {mode === "signin" ? "Forgot password?" : "Back to sign in"}
          </button>
        </form>
      )}
      <p className="mt-8 text-badge font-normal text-subtle">No account? Access is by invitation. Ask your supply chain administrator.</p>
    </AuthShell>
  );
}

function SetPassword({ via }: { via: "invite" | "recovery" }) {
  const init = useDashboard((s) => s.init);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 10) return setError("Use at least 10 characters.");
    if (pw !== pw2) return setError("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    window.history.replaceState(null, "", window.location.pathname);
    useDashboard.getState().setAuthStatus("loading");
    void init();
  };

  return (
    <AuthShell>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-input bg-brand-soft text-brand">
        <KeyRound size={18} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-title text-fg">{via === "invite" ? "Welcome. Set your password" : "Choose a new password"}</h1>
      <p className="mt-1 text-body text-subtle">You'll use it with your email to sign in from now on.</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field id="pw-new" label="New password" type="password" value={pw} onChange={setPw} autoComplete="new-password" hint="At least 10 characters." />
        <Field id="pw-confirm" label="Confirm password" type="password" value={pw2} onChange={setPw2} autoComplete="new-password" />
        {error && (
          <p role="alert" className="rounded-btn bg-bad/10 px-3 py-2 text-body text-bad">
            {error}
          </p>
        )}
        <SubmitButton busy={busy}>Set password and continue</SubmitButton>
      </form>
    </AuthShell>
  );
}

function NoRole() {
  return (
    <AuthShell>
      <h1 className="text-title text-fg">Waiting for access</h1>
      <p className="mt-2 text-body text-muted">You're signed in, but your account doesn't have a role yet. Ask your administrator to assign one, then sign in again.</p>
      <button type="button" onClick={() => supabase?.auth.signOut()} className="mt-6 inline-flex h-10 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-body font-semibold text-fg hover:bg-surface-2">
        <LogOut size={16} aria-hidden="true" /> Sign out
      </button>
    </AuthShell>
  );
}

function Loading() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-bg text-subtle" role="status">
      <Loader2 size={22} className="animate-spin text-brand" aria-hidden="true" />
      <p className="text-body">Connecting to your control tower</p>
      <p className="max-w-xs text-center text-badge font-normal">The server may take up to a minute to wake after a quiet period.</p>
    </div>
  );
}

/* ---------- gate ---------- */

/** Renders the app only for signed-in users with a role. With Supabase unconfigured it renders the app directly (demo). */
export function AuthGate({ children }: { children: ReactNode }) {
  const { authStatus, setAuthStatus, init, reset } = useDashboard();
  const [via] = useState(arrivedVia);

  useEffect(() => {
    if (!supabase) {
      void init();
      return;
    }
    setUnauthorizedHandler(() => void supabase!.auth.signOut());
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return setAuthStatus("signedOut");
      if (via) return setAuthStatus("setPassword");
      void init();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        reset();
        setAuthStatus("signedOut");
      } else if (event === "PASSWORD_RECOVERY") {
        setAuthStatus("setPassword");
      } else if (event === "SIGNED_IN" && useDashboard.getState().authStatus === "signedOut") {
        setAuthStatus("loading");
        void init();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [init, reset, setAuthStatus, via]);

  if (authStatus === "disabled" || authStatus === "signedIn") return <>{children}</>;
  if (authStatus === "signedOut") return <SignIn />;
  if (authStatus === "setPassword") return <SetPassword via={via ?? "recovery"} />;
  if (authStatus === "noRole") return <NoRole />;
  return <Loading />;
}
