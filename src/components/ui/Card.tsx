import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <section className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_38px_rgba(91,75,133,.08)] sm:p-6 ${className}`} {...props}>{children}</section>;
}
