"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Copy, Crown, DoorOpen, LoaderCircle, Play, Radio, ShieldCheck, UsersRound } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import type { Difficulty } from "@/lib/sudoku/types";
import type { RoomMemberView, RoomView } from "@/lib/multiplayer/types";
import { AvatarSVG } from "@/components/avatar/AvatarSVG";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface Profile { profile: { id:string; username:string } }
export default function MultiplayerRoomPage() {
  const t=useT();const router=useRouter();const params=useParams<{code:string}>();const code=params.code.toUpperCase();
  const [room,setRoom]=useState<RoomView|null>(null);const [profileId,setProfileId]=useState("");const [error,setError]=useState("");const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
  const poll=useCallback(async()=>{
    try{
      const data=await apiFetch<{room:RoomView}>(`/api/multiplayer/rooms/${encodeURIComponent(code)}`);setRoom(data.room);setError("");
      if(data.room.matchId && ["countdown","racing","finished"].includes(data.room.status)) router.replace(`/multiplayer/match/${data.room.matchId}`);
    }catch(e){setError(e instanceof Error?e.message:t("errors.generic"));}
  },[code,router,t]);
  useEffect(()=>{apiFetch<Profile>("/api/profile").then(p=>setProfileId(p.profile.id)).catch((e:unknown)=>setError(e instanceof Error?e.message:t("errors.generic")));void poll();const id=window.setInterval(()=>void poll(),2200);const heartbeat=window.setInterval(()=>{void apiFetch(`/api/multiplayer/rooms/${encodeURIComponent(code)}/heartbeat`,{method:"POST"}).catch(()=>{});},6000);return()=>{window.clearInterval(id);window.clearInterval(heartbeat);};},[code,poll,t]);
  const me=useMemo(()=>room?.members.find(m=>m.profileId===profileId),[room,profileId]);
  const everyoneReady=!!room&&room.members.length>=2&&room.members.every(m=>m.isHost||m.isReady);
  const act=async(path:string,body?:unknown)=>{setBusy(true);setError("");try{await apiFetch(path,{method:"POST",...(body===undefined?{}:{body:JSON.stringify(body)})});await poll();}catch(e){setError(e instanceof Error?e.message:t("errors.generic"));}finally{setBusy(false);}};
  const start=async()=>{setBusy(true);setError("");try{const result=await apiFetch<{matchId:string}>(`/api/multiplayer/rooms/${encodeURIComponent(code)}/start`,{method:"POST"});router.push(`/multiplayer/match/${result.matchId}`);}catch(e){setError(e instanceof Error?e.message:t("errors.generic"));}finally{setBusy(false);}};
  const leave=async()=>{setBusy(true);try{await apiFetch(`/api/multiplayer/rooms/${encodeURIComponent(code)}/leave`,{method:"POST"});router.push("/multiplayer");}catch(e){setError(e instanceof Error?e.message:t("errors.generic"));}finally{setBusy(false);}};
  const copyCode=async()=>{try{await navigator.clipboard.writeText(code);setNotice(t("common.copied"));}catch{setNotice(code);}};
  if(!room)return <PageWrapper><Spinner/>{error&&<Toast message={error} onClose={()=>setError("")}/>}</PageWrapper>;
  return <PageWrapper className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-extrabold uppercase tracking-[.18em] text-pink-500">{t("multiplayer.waitingForPlayers")}</p><h1 className="mt-2 text-3xl font-black text-slate-800">{t("multiplayer.createRoomTitle")}</h1><p className="mt-2 text-slate-500">{t(`difficulty.${room.difficulty as Difficulty}`)} · {room.timeLimitS/60} {t("multiplayer.minutes")}</p></div><Button variant="secondary" onClick={()=>void leave()} disabled={busy}><DoorOpen size={17}/>{t("multiplayer.leaveRoom")}</Button></header>
    <Card className="overflow-hidden bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">{t("multiplayer.roomCode")}</p><div className="mt-1 font-mono text-4xl font-black tracking-[.25em] text-violet-700 sm:text-5xl">{code}</div><p className="mt-2 text-sm text-slate-500">{t("multiplayer.shareHint")}</p></div><Button variant="secondary" onClick={()=>void copyCode()}><Copy size={17}/>{t("multiplayer.copyCode")}</Button></div></Card>
    <Card><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-800">{t("multiplayer.players")}</h2><p className="mt-1 font-number text-sm text-slate-500">{room.members.length} / {room.maxPlayers}</p></div><div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600"><Radio size={14}/>{room.status === "lobby" ? t("multiplayer.waitingForPlayers") : t("multiplayer.countdown")}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:room.maxPlayers},(_,index)=>{
      const member:RoomMemberView|undefined=room.members.find(m=>m.seat===index);
      return <div key={index} className={`rounded-3xl border p-4 ${member?"border-white bg-gradient-to-br from-white to-violet-50 shadow-sm":"border-dashed border-slate-200 bg-slate-50/70"}`}>
        {member?<><div className="flex items-start justify-between"><div className="grid size-20 place-items-center rounded-2xl bg-white"><AvatarSVG config={member.equipped} size={70}/></div>{member.isHost?<span title={t("multiplayer.host")} className="rounded-xl bg-amber-50 p-2 text-amber-500"><Crown size={18}/></span>:member.isReady?<span className="rounded-xl bg-emerald-50 p-2 text-emerald-500"><ShieldCheck size={18}/></span>:<span className="rounded-xl bg-slate-100 p-2 text-slate-400"><LoaderCircle size={18}/></span>}</div><h3 className="mt-3 truncate font-black text-slate-800">{member.username}{member.profileId===profileId?` · ${t("multiplayer.you")}`:""}</h3><div className="mt-2 flex items-center justify-between gap-2"><span className={`text-xs font-bold ${member.isReady?"text-emerald-600":"text-slate-400"}`}>{member.isHost?t("multiplayer.host"):member.isReady?t("multiplayer.ready"):t("multiplayer.notReady")}</span><span className={`size-2 rounded-full ${member.connected?"bg-emerald-400":"bg-slate-300"}`} title={member.connected?t("multiplayer.connected"):t("multiplayer.disconnected")}/></div></>:<div className="grid min-h-36 place-items-center text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-300"><UsersRound size={22}/></div><p className="mt-3 text-sm font-bold text-slate-400">{t("multiplayer.waitingForPlayers")}</p></div></div>}
      </div>;
    })}</div>
    <div className="mt-6 flex flex-wrap justify-center gap-3">{me&&!me.isHost&&<Button variant={me.isReady?"secondary":"primary"} onClick={()=>void act(`/api/multiplayer/rooms/${encodeURIComponent(code)}/ready`,{ready:!me.isReady})} disabled={busy}>{me.isReady?<Check size={17}/>:<ShieldCheck size={17}/>}{me.isReady?t("multiplayer.cancelReady"):t("multiplayer.toggleReady")}</Button>}{me?.isHost&&<Button onClick={()=>void start()} disabled={busy||!everyoneReady}><Play size={17}/>{t("multiplayer.startMatch")}</Button>}</div>
    {!everyoneReady&&<p className="mt-4 text-center text-sm font-semibold text-slate-400">{t("multiplayer.needReady")}</p>}</Card>
    {error&&<Toast message={error} onClose={()=>setError("")}/>} {notice&&<Toast message={notice} type="success" onClose={()=>setNotice("")}/>}
  </PageWrapper>;
}
