import { Link } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  gold: "bg-gold text-primary-foreground shadow-gold hover:brightness-110",
  outline: "border border-primary/50 text-primary hover:bg-primary/10",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
  danger: "border border-destructive/50 text-destructive hover:bg-destructive/10",
};

export function Btn({ variant = "gold", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card p-5", className)}>{children}</div>;
}

export function Field({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input {...p} className="w-full rounded-md border bg-input/40 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold font-display text-sm font-bold text-primary-foreground">100</span>
      <span className="font-display text-lg leading-none">
        Barbearia <span className="text-gold">100 Erro</span>
      </span>
    </Link>
  );
}

export function TopNav() {
  const link = "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground";
  const active = { className: "rounded-md px-3 py-1.5 text-sm bg-secondary text-primary" };
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Logo />
        <nav className="flex gap-1">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Agendar</Link>
          <Link to="/cliente" className={link} activeProps={active}>Minha conta</Link>
          <Link to="/admin" className={link} activeProps={active}>Gestor</Link>
        </nav>
      </div>
    </header>
  );
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "muted" | "success" }) {
  const t = { gold: "bg-accent text-accent-foreground", muted: "bg-secondary text-muted-foreground", success: "bg-success/15 text-success" }[tone];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}
