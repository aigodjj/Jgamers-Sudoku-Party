"use client";
import { Trophy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n";

export function GameOverlay({ open, title, body, onClose, actionLabel }: { open: boolean; title: string; body: string; onClose: () => void; actionLabel?: string }) {
  const t = useT();
  return <Modal open={open} title={title} onClose={onClose} footer={<Button onClick={onClose}>{actionLabel ?? t("common.continue")}</Button>}><div className="py-3 text-center"><Trophy size={46} className="mx-auto text-amber-400"/><p className="mt-3 text-slate-600">{body}</p></div></Modal>;
}
