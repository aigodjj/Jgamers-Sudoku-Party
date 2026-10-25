"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Award, CheckCircle2, Clock3, Swords, Trophy } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch, formatDuration } from "@/lib/api/client";
import type { MatchStateView } from "@/lib/multiplayer/types";
import { SudokuGamePanel, type VictoryDetails } from "@/components/game/SudokuGamePanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface Profile { profile: { id:string } }
interface SubmitResponse { ok:boolean; correct:boolean; placement?:number; finishTimeMs?:number }
export default function MultiplayerMatchPage() {
  const t=useT();const router=useRouter();const params=useParams<{id:string}>();const matchId=params.id;
  const [match,setMatch]=useState<MatchStateView|null>(null);const [profileId,setProfileId]=useState("");const [countdown,setCountdown]=useState(0);const [finishDetails,setFinishDetails]=useState<VictoryDetails|null>(null);const [error,setError]=useState("");const [submitNotice,setSubmitNotice]=useState("");
  const clockOffsetRef=useRef(0);const boardRef=useRef("".padEnd(81,"0"));const mistakesRef=useRef(0);const submittedRef=useRef(false);
  const pollMatch=useCallback(async()=>{
    try{const data=await apiFetch<{match:MatchStateView}>(`/api/multiplayer/matches/${encodeURIComponent(matchId)}`);clockOffsetRef.current=Date.parse(data.match.serverNow)-Date.now();setMatch(data.match);setError("");}
    catch(e){setError(e instanceof Error?e.message:t("errors.generic"));}
  },[matchId,t]);
  useEffect(()=>{apiFetch<Profile>("/api/profile").then(p=>setProfileId(p.profile.id)).catch(()=>{});void pollMatch();const id=window.setInterval(()=>void pollMatch(),2500);return()=>window.clearInterval(id);},[pollMatch]);
  useEffect(()=>{if(!match)return;const update=()=>setCountdown(Math.max(0,Math.ceil((Date.parse(match.startAt)-(Date.now()+clockOffsetRef.current))/1000)));update();const id=window.setInterval(update,200);return()=>window.clearInterval(id);},[match?.startAt,match]);
  const onBoardChange=useCallback((board:string,mistakes:number)=>{boardRef.current=board;mistakesRef.current=mistakes;},[]);
  const onComplete=useCallback(async(info:{board:string;timeMs:number;mistakes:number;hintsUsed:number}):Promise<boolean>=>{
    if(submittedRef.current)return false;submittedRef.current=true;boardRef.current=info.board;mistakesRef.current=info.mistakes;
    try{const result=await apiFetch<SubmitResponse>(`/api/multiplayer/matches/${encodeURIComponent(matchId)}/submit`,{method:"POST",body:JSON.stringify({board:info.board,mistakes:info.mistakes,hintsUsed:info.hintsUsed})});
      if(result.correct){setFinishDetails({placement:result.placement,message:t("multiplayer.results")});setSubmitNotice(t("multiplayer.finished"));await pollMatch();return true;}
      setSubmitNotice(t("sudoku.invalidSolution"));submittedRef.current=false;await pollMatch();return false;
    }catch(e){setError(e instanceof Error?e.message:t("errors.generic"));submittedRef.current=false;return false;}
  },[matchId,pollMatch,t]);
  useEffect(()=>{
    if(!match||countdown>0||match.status==="finished"||match.status==="aborted")return;
    const id=window.setInterval(async()=>{
      try{
        await apiFetch(`/api/multiplayer/matches/${encodeURIComponent(matchId)}/progress`,{method:"POST",body:JSON.stringify({board:boardRef.current,mistakes:mistakesRef.current})});
        const data=await apiFetch<{match:MatchStateView}>(`/api/multiplayer/matches/${encodeURIComponent(matchId)}`);
        clockOffsetRef.current=Date.parse(data.match.serverNow)-Date.now();setMatch(data.match);
      }catch{/* transient polling failures are retried on the next interval */}
    },2500);
    return()=>window.clearInterval(id);
  },[matchId,match?.id,match?.status,countdown]);
  const leaderboard=useMemo(()=>[...(match?.results??[])].sort((a,b)=>{
    if(a.completed!==b.completed)return a.completed?-1:1;
    if(a.placement!==null&&b.placement!==null)return a.placement-b.placement;
    return b.correctCells-a.correctCells;
  }),[match?.results]);
  const myResult=leaderboard.find(r=>r.profileId===profileId);
  useEffect(()=>{if(match?.status==="finished"&&myResult&&!finishDetails)setFinishDetails({placement:myResult.placement??undefined,message:myResult.completed?t("multiplayer.results"):t("multiplayer.dnf")});},[match?.status,myResult,finishDetails,t]);
  if(!match)return <PageWrapper><Spinner/>{error&&<Toast message={error} onClose={()=>setError("")}/>}</PageWrapper>;
  const ended=match.status==="finished"||match.status==="aborted";
  return <PageWrapper className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-extrabold uppercase tracking-[.18em] text-pink-500">{t("multiplayer.racing")}</p><h1 className="mt-2 text-3xl font-black text-slate-800">{t("multiplayer.title")}</h1><p className="mt-2 text-slate-500">{t(`difficulty.${match.difficulty}`)} · {match.rated?t("multiplayer.rated"):t("multiplayer.unranked")}</p></div><div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"><Clock3 size={18} className="text-violet-500"/><span className="font-mono font-black text-slate-700">{countdown>0?t("multiplayer.startingIn",{s:countdown}):t("multiplayer.racing")}</span></div></header>
    {!ended&&countdown>0?<><Card className="overflow-hidden bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100 py-14 text-center"><div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-white text-violet-500 shadow-lg"><Swords size={40}/></div><p className="mt-6 text-sm font-extrabold uppercase tracking-[.2em] text-violet-500">{t("multiplayer.countdown")}</p><div className="mt-2 text-7xl font-black tabular-nums text-slate-800">{countdown}</div><p className="mt-3 text-slate-500">{t("multiplayer.startingIn",{s:countdown})}</p></Card><Leaderboard rows={leaderboard} currentProfileId={profileId} t={t}/></>:null}
    {!ended&&countdown===0&&<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]"><div><SudokuGamePanel title={t("multiplayer.racing")} difficulty={match.difficulty} givens={match.givens} onComplete={onComplete} onBoardChange={onBoardChange} multiplayer onExit={()=>router.push("/multiplayer") } victoryDetails={finishDetails}/></div><div className="space-y-4"><Leaderboard rows={leaderboard} currentProfileId={profileId} t={t}/><Card className="!p-4"><h2 className="font-black text-slate-700">{t("multiplayer.yourProgress")}</h2><div className="mt-2 text-3xl font-black text-violet-600">{myResult?.correctCells??0}<span className="ml-1 text-sm font-bold text-slate-400">/ 81</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-50"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-400" style={{width:`${(myResult?.correctCells??0)/81*100}%`}}/></div><p className="mt-3 text-xs leading-relaxed text-slate-400">{t("game.progressSyncNote")}</p></Card></div></div>}
    {ended&&<Card className="py-12 text-center"><Trophy size={54} className="mx-auto text-amber-400"/><h2 className="mt-4 text-3xl font-black text-slate-800">{t("multiplayer.finished")}</h2><p className="mt-2 text-slate-500">{t("multiplayer.results")}</p>{myResult?.placement&&<p className="mt-3 text-xl font-black text-violet-600">{t("multiplayer.placement")} #{myResult.placement}</p>}<div className="mx-auto mt-6 max-w-2xl text-left"><Leaderboard rows={leaderboard} currentProfileId={profileId} t={t}/></div><div className="mt-6 flex justify-center gap-3"><Button onClick={()=>router.push("/multiplayer")}>{t("multiplayer.returnToLobby")}</Button><Button variant="secondary" onClick={()=>router.push("/")}>{t("multiplayer.returnHome")}</Button></div></Card>}
    <Modal open={ended} title={t("multiplayer.finished")} onClose={()=>router.push("/multiplayer")} footer={<><Button variant="secondary" onClick={()=>router.push("/")}>{t("multiplayer.returnHome")}</Button><Button onClick={()=>router.push("/multiplayer")}>{t("multiplayer.returnToLobby")}</Button></>}><div className="py-3 text-center"><Award size={44} className="mx-auto text-amber-400"/><p className="mt-3 font-bold text-slate-600">{myResult?.completed?t("multiplayer.results"):t("multiplayer.dnf")}</p>{myResult?.placement&&<p className="mt-3 text-3xl font-black text-violet-600">#{myResult.placement}</p>}<p className="mt-3 text-sm text-slate-400">{t("multiplayer.results")}</p></div></Modal>
    {error&&<Toast message={error} onClose={()=>setError("")}/>} {submitNotice&&<Toast message={submitNotice} type={submitNotice===t("multiplayer.finished")?"success":"error"} onClose={()=>setSubmitNotice("")}/>}
  </PageWrapper>;
}
function Leaderboard({rows,currentProfileId,t}:{rows:MatchStateView["results"];currentProfileId:string;t:(key:string,vars?:Record<string,string|number>)=>string}){
  return <Card className="!p-4"><div className="mb-4 flex items-center gap-2"><Trophy size={19} className="text-amber-400"/><h2 className="font-black text-slate-800">{t("multiplayer.liveLeaderboard")}</h2></div>{rows.length===0?<p className="py-5 text-center text-sm text-slate-400">{t("multiplayer.waitingForPlayers")}</p>:<div className="space-y-3">{rows.map((row,index)=><div key={row.profileId} className={`flex items-center gap-3 rounded-2xl p-3 ${row.profileId===currentProfileId?"bg-violet-50":"bg-slate-50"}`}><div className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black ${index===0?"bg-amber-100 text-amber-600":"bg-white text-slate-500"}`}>{row.placement??index+1}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold text-slate-700">{row.username}{row.profileId===currentProfileId?` · ${t("multiplayer.you")}`:""}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-violet-400" style={{width:`${row.correctCells/81*100}%`}}/></div></div><div className="text-right"><div className="text-sm font-black tabular-nums text-violet-600">{row.correctCells}/81</div>{row.completed&&<CheckCircle2 size={14} className="ml-auto mt-1 text-emerald-500"/>}</div></div>)}</div>}</Card>;
}
