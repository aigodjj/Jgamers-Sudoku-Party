import type { ReactNode } from "react";
export function PageWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`min-h-[calc(100vh-4rem)] w-full px-1 py-6 sm:px-2 sm:py-9 lg:px-3 ${className}`}>{children}</main>;
}
