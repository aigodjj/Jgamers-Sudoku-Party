"use client";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n";

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose?: () => void; footer?: ReactNode }) {
  const t = useT();
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-4 flex items-start justify-between gap-4"><h2 className="text-2xl font-black text-slate-800">{title}</h2>{onClose && <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label={t("common.close")}><X size={20} /></button>}</div>
      <div>{children}</div>
      {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
    </div>
  </div>;
}
