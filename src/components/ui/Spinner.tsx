import { LoaderCircle } from "lucide-react";
import { useT } from "@/i18n";

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-violet-500"><LoaderCircle className="animate-spin" size={28} /><span className="text-sm font-semibold text-slate-500">{label ?? t("common.loading")}</span></div>;
}
