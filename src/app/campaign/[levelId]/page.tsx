"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { solveUnique } from "@/lib/sudoku/solver";
import { parseBoardString, boardToString, type Difficulty } from "@/lib/sudoku/types";
import { SudokuGamePanel, type VictoryDetails } from "@/components/game/SudokuGamePanel";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface LevelPuzzle { levelId: string; difficulty: Difficulty; givens: string; stageIndex: number; levelInStage: number }
interface CompletionResult { stars: number; coinsAwarded: number; isNewBest: boolean }
export default function CampaignLevelPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ levelId: string }>();
  const levelId = params.levelId;
  const [puzzle, setPuzzle] = useState<LevelPuzzle | null>(null);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<VictoryDetails | null>(null);
  useEffect(() => { apiFetch<LevelPuzzle>(`/api/campaign/${encodeURIComponent(levelId)}`).then(setPuzzle).catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic"))); }, [levelId, t]);
  const solution = useMemo(() => { if (!puzzle) return undefined; const solved = solveUnique(parseBoardString(puzzle.givens)); return solved ? boardToString(solved) : undefined; }, [puzzle]);
  const onComplete = useCallback(async (info: { board: string; timeMs: number; mistakes: number; hintsUsed: number }) => {
    try {
      const result = await apiFetch<CompletionResult>(`/api/campaign/${encodeURIComponent(levelId)}/complete`, { method: "POST", body: JSON.stringify(info) });
      setDetails({ stars: result.stars, coinsAwarded: result.coinsAwarded, message: result.isNewBest ? `${t("sudoku.newBest")} ${t("sudoku.victorySubtitle")}` : t("sudoku.victorySubtitle") });
    } catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
  }, [levelId, t]);
  if (error && !puzzle) return <PageWrapper><div className="rounded-3xl bg-white p-7 text-center"><p className="font-bold text-rose-500">{error}</p><button className="mt-4 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white" onClick={() => router.push("/campaign")}>{t("campaign.title")}</button></div></PageWrapper>;
  if (!puzzle || !solution) return <PageWrapper><Spinner/></PageWrapper>;
  return <PageWrapper><SudokuGamePanel title={`${t("campaign.stage")} ${puzzle.stageIndex + 1} · ${t("campaign.level", { n: puzzle.levelInStage })}`} difficulty={puzzle.difficulty} givens={puzzle.givens} solution={solution} onComplete={onComplete} onExit={() => router.push("/campaign")} victoryDetails={details}/>{error && <Toast message={error} onClose={() => setError("")}/>}</PageWrapper>;
}
