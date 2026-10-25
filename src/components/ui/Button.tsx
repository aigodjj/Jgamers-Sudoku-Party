import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; children: ReactNode }) {
  const styles = {
    primary: "bg-violet-500 text-white shadow-lg shadow-violet-200 hover:bg-violet-600 active:scale-[.98]",
    secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-violet-50 active:scale-[.98]",
    ghost: "bg-transparent text-slate-600 hover:bg-violet-50 active:scale-[.98]",
    danger: "bg-rose-500 text-white hover:bg-rose-600 active:scale-[.98]",
  };
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
