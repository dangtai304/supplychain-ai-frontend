import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "link";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:opacity-90",
  secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  link: "text-brand hover:text-brand-strong px-0 h-auto",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-btn font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-7 px-2.5 text-label" : "h-8 px-3 text-body",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Square icon-only button. `label` is required: it becomes aria-label and the tooltip. */
export function IconButton({
  label,
  className,
  children,
  tone = "default",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode; tone?: "default" | "nav" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn transition-colors",
        tone === "nav" ? "text-nav-muted hover:bg-nav-2 hover:text-nav-fg" : "text-subtle hover:bg-surface-2 hover:text-fg",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
