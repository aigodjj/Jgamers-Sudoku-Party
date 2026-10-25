"use client";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toast({ message, type = "error", onClose }: { message: string; type?: "error" | "success"; onClose?: () => void }) {
  if (!message) return null;
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return <div role="status" className={`fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}><Icon size={18} /><span className="flex-1">{message}</span>{onClose && <button onClick={onClose} className="px-2">×</button>}</div>;
}
