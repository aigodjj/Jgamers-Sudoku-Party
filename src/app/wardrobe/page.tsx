"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Coins, LockKeyhole, RotateCcw } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { OPTIONAL_CATEGORIES, type CosmeticCategory } from "@/lib/cosmetics/catalog";
import { AvatarSVG } from "@/components/avatar/AvatarSVG";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface CosmeticItem { id: string; category: CosmeticCategory; nameKey: string; colorValue?: string; renderKey: string; unlockType: string; price: number; owned: boolean; equipped: boolean; locked: boolean; unlockAchievementId?: string }
interface ProfileResponse { profile: { coins: number; username: string }; equipped: Record<string,string> }
const categories: CosmeticCategory[] = ["skin", "hairStyle", "hairColor", "face", "top", "bottom", "dress", "shoes", "hat", "glasses", "accessory"];
export default function WardrobePage() {
  const t = useT();
  const [items, setItems] = useState<CosmeticItem[] | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [active, setActive] = useState<CosmeticCategory>("skin");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const refresh = useCallback(async () => {
    const [wardrobe, player] = await Promise.all([apiFetch<{ items: CosmeticItem[] }>("/api/cosmetics"), apiFetch<ProfileResponse>("/api/profile")]);
    setItems(wardrobe.items); setProfile(player);
  }, []);
  useEffect(() => { void refresh().catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic"))); }, [refresh, t]);
  const selectedItems = useMemo(() => items?.filter((item) => item.category === active) ?? [], [items, active]);
  const equipped = useMemo(() => Object.fromEntries((items ?? []).filter((item) => item.equipped).map((item) => [item.category, item.id])) as Record<string,string>, [items]);
  const act = async (item: CosmeticItem, action: "equip" | "buy") => {
    setBusy(item.id); setError(""); setNotice("");
    try {
      if (action === "buy") {
        await apiFetch<{ coins: number }>("/api/cosmetics/purchase", { method: "POST", body: JSON.stringify({ cosmeticId: item.id }) });
        setNotice(t("wardrobe.purchaseSuccess"));
      } else {
        await apiFetch("/api/cosmetics/equip", { method: "POST", body: JSON.stringify({ cosmeticId: item.id }) });
        setNotice(t("wardrobe.autoSaved"));
      }
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
    finally { setBusy(null); }
  };
  const unequip = async () => {
    setBusy("unequip");
    try { await apiFetch("/api/cosmetics/equip", { method: "POST", body: JSON.stringify({ unequipCategory: active }) }); await refresh(); setNotice(t("wardrobe.autoSaved")); }
    catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
    finally { setBusy(null); }
  };
  const reset = async () => {
    setBusy("reset");
    try { await apiFetch("/api/cosmetics/reset", { method: "POST" }); await refresh(); setNotice(t("wardrobe.autoSaved")); }
    catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
    finally { setBusy(null); setResetOpen(false); }
  };
  if (!items || !profile) return <PageWrapper><Spinner/>{error && <Toast message={error} onClose={() => setError("")}/>}</PageWrapper>;
  return <PageWrapper className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-extrabold uppercase tracking-[.18em] text-pink-500">{t("nav.wardrobe")}</p><h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">{t("wardrobe.title")}</h1><p className="mt-2 text-slate-500">{t("wardrobe.subtitle")}</p></div><div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 font-number font-black text-amber-600"><Coins size={20}/>{profile.profile.coins}</div></header>
    <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="space-y-4 lg:sticky lg:top-24"><Card className="overflow-hidden bg-gradient-to-b from-pink-50 via-violet-50 to-sky-50 text-center"><div className="mx-auto grid min-h-64 place-items-center"><AvatarSVG config={equipped} size={210}/></div><h2 className="mt-2 text-xl font-black text-slate-800">{profile.profile.username}</h2><p className="mt-1 text-xs font-semibold text-slate-400">{t("wardrobe.autoSaved")}</p><Button variant="secondary" className="mt-4 w-full" onClick={() => setResetOpen(true)}><RotateCcw size={16}/>{t("wardrobe.resetAppearance")}</Button></Card><Card className="!p-3"><p className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">{t("wardrobe.categoryHeader")}</p><div className="grid grid-cols-2 gap-1">{categories.map((category) => <button key={category} onClick={() => setActive(category)} className={`rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${active === category ? "bg-violet-500 text-white shadow-md shadow-violet-200" : "text-slate-600 hover:bg-violet-50"}`}>{t(`wardrobe.categories.${category}`)}<span className={`ml-1 text-xs ${active === category ? "text-violet-100" : "text-slate-400"}`}>{items.filter(i => i.category === category).length}</span></button>)}</div></Card></div>
      <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-800">{t(`wardrobe.categories.${active}`)}</h2><p className="mt-1 font-number text-sm text-slate-500">{selectedItems.filter(i=>i.owned).length} / {selectedItems.length} · {t("wardrobe.owned")}</p></div>{OPTIONAL_CATEGORIES.some((category) => category === active) && equipped[active] && <Button variant="secondary" onClick={unequip} disabled={busy !== null}>{t("wardrobe.unequip")}</Button>}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{selectedItems.map((item) => <Card key={item.id} className={`relative !p-3 sm:!p-4 ${item.equipped ? "ring-2 ring-violet-400" : ""}`}><div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50">{item.colorValue ? <span className="size-16 rounded-full border-4 border-white shadow-lg" style={{backgroundColor:item.colorValue}}/> : <div className="grid size-20 place-items-center rounded-[1.5rem] bg-white text-4xl shadow-sm">{item.category === "hat" ? "🎩" : item.category === "glasses" ? "🤓" : item.category === "shoes" ? "👟" : item.category === "accessory" ? "🎀" : item.category === "hairStyle" ? "💇" : item.category === "face" ? "😊" : item.category === "dress" ? "👗" : "👕"}</div>}{!item.owned && <span className="absolute right-2 top-2 rounded-full bg-slate-800/70 p-1.5 text-white"><LockKeyhole size={13}/></span>}{item.equipped && <span className="absolute left-2 top-2 rounded-full bg-emerald-500 p-1.5 text-white"><Check size={13}/></span>}</div><h3 className="mt-3 line-clamp-1 text-sm font-extrabold text-slate-700">{t(item.nameKey)}</h3><p className="mt-1 min-h-4 font-number text-xs font-bold text-slate-400">{item.equipped ? t("wardrobe.equipped") : item.owned ? t("wardrobe.owned") : item.unlockType === "coins" ? `${item.price} 🪙` : t("wardrobe.locked")}</p><div className="mt-3">{item.equipped ? <Button className="w-full" disabled><Check size={15}/>{t("wardrobe.equipped")}</Button> : item.owned ? <Button variant="secondary" className="w-full" disabled={busy !== null} onClick={() => void act(item,"equip")}>{busy === item.id ? "…" : t("wardrobe.equip")}</Button> : item.unlockType === "coins" ? <Button className="w-full" disabled={busy !== null || profile.profile.coins < item.price} onClick={() => void act(item,"buy")}><Coins size={15}/>{busy === item.id ? "…" : t("wardrobe.buy")}</Button> : <div className="rounded-xl bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-400">{t("wardrobe.unlockByAchievement", { title: item.unlockAchievementId ? t(({ campaign_champion: "achievement.campaignChampion.title", first_steps: "achievement.firstSteps.title", flawless_solve: "achievement.flawless.title", puzzle_explorer: "achievement.puzzleExplorer.title", race_veteran: "achievement.raceVeteran.title", speed_solver: "achievement.speedSolver.title" } as Record<string, string>)[item.unlockAchievementId] ?? "achievements.title") : t("achievements.title") })}</div>}</div></Card>)}</div></div>
    </div>
    {notice && <Toast message={notice} type="success" onClose={() => setNotice("")}/>} {error && <Toast message={error} onClose={() => setError("")}/>}
    <Modal open={resetOpen} title={t("wardrobe.resetConfirmTitle")} onClose={() => setResetOpen(false)} footer={<><Button variant="secondary" onClick={() => setResetOpen(false)}>{t("common.cancel")}</Button><Button onClick={() => void reset()} disabled={busy !== null}><RotateCcw size={16}/>{t("wardrobe.resetAppearance")}</Button></>}><p className="text-slate-600">{t("wardrobe.resetConfirmBody")}</p></Modal>
  </PageWrapper>;
}
