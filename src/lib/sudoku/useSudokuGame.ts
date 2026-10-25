"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board, boxOf, cellIndex, CellValue, colOf, parseBoardString, rowOf, TOTAL_CELLS } from "./types";
import { countFilledCells, findConflicts, isBoardComplete, isBoardValidSoFar } from "./validator";

export interface HistoryEntry {
  board: Board;
  notes: Set<number>[];
}

export interface UseSudokuGameOptions {
  /** An 81-character puzzle string. 0 or . means empty. */
  givens: string;
  /** Available for single-player modes. Multiplayer can omit the solution. */
  solution?: string;
  maxMistakes?: number;
  maxHints?: number;
  onComplete?: (info: { timeMs: number; mistakes: number; hintsUsed: number; board: string }) => void | boolean | Promise<void | boolean>;
}

export type SelectMode = "digit" | "note";
const emptyNotes = (): Set<number>[] => Array.from({ length: TOTAL_CELLS }, () => new Set<number>());
const cloneNotes = (notes: Set<number>[]) => notes.map((s) => new Set(s));
const formatSnapshot = (board: Board, notes: Set<number>[]): HistoryEntry => ({ board: board.slice(), notes: cloneNotes(notes) });

export function useSudokuGame({ givens, solution, maxMistakes = 3, maxHints = 3, onComplete }: UseSudokuGameOptions) {
  const givensBoard = useMemo(() => parseBoardString(givens), [givens]);
  const solutionBoard = useMemo(() => (solution ? parseBoardString(solution) : null), [solution]);
  const fixedMask = useMemo(() => givensBoard.map((v) => v !== 0), [givensBoard]);

  const [board, setBoard] = useState<Board>(() => givensBoard.slice());
  const [notes, setNotes] = useState<Set<number>[]>(emptyNotes);
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<SelectMode>("digit");
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedCells, setHintedCells] = useState<Set<number>>(new Set());
  const [wrongCells, setWrongCells] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isDefeated, setIsDefeated] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => [formatSnapshot(givensBoard, emptyNotes())]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const boardRef = useRef(board);
  const notesRef = useRef(notes);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const completedRef = useRef(false);
  const validatingRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const resetPuzzle = useCallback(() => {
    const initialBoard = givensBoard.slice();
    const initialNotes = emptyNotes();
    const initialHistory = [formatSnapshot(initialBoard, initialNotes)];
    setBoard(initialBoard);
    setNotes(initialNotes);
    setSelected(null);
    setMode("digit");
    setMistakes(0);
    setHintsUsed(0);
    setHintedCells(new Set());
    setWrongCells(new Set());
    setIsCompleted(false);
    setIsValidating(false);
    setIsDefeated(false);
    setIsPaused(false);
    setElapsedMs(0);
    setHistory(initialHistory);
    setHistoryIndex(0);
    boardRef.current = initialBoard;
    notesRef.current = initialNotes;
    historyRef.current = initialHistory;
    historyIndexRef.current = 0;
    completedRef.current = false;
    validatingRef.current = false;
    startTimeRef.current = Date.now();
    pausedAccumRef.current = 0;
    pauseStartRef.current = null;
  }, [givensBoard]);

  useEffect(() => { resetPuzzle(); }, [resetPuzzle]);

  useEffect(() => {
    if (isCompleted || isDefeated) return;
    const interval = window.setInterval(() => {
      if (!isPaused) setElapsedMs(Math.max(0, Date.now() - startTimeRef.current - pausedAccumRef.current));
    }, 250);
    return () => window.clearInterval(interval);
  }, [isPaused, isCompleted, isDefeated]);

  const pushHistory = useCallback((nextBoard: Board, nextNotes: Set<number>[]) => {
    const nextIndex = historyIndexRef.current + 1;
    const nextHistory = [...historyRef.current.slice(0, nextIndex), formatSnapshot(nextBoard, nextNotes)];
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }, []);

  const complete = useCallback(async (finalBoard: Board, mistakesValue: number, hintsValue: number) => {
    if (completedRef.current || validatingRef.current) return;
    const solved = solutionBoard
      ? isBoardComplete(finalBoard, solutionBoard)
      : countFilledCells(finalBoard) === TOTAL_CELLS && isBoardValidSoFar(finalBoard);
    if (!solved) return;
    const timeMs = Math.max(0, Date.now() - startTimeRef.current - pausedAccumRef.current - (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0));
    const info = { timeMs, mistakes: mistakesValue, hintsUsed: hintsValue, board: finalBoard.map(String).join("") };

    // Single-player has a local solution, so the board can be confirmed immediately.
    // Multiplayer deliberately omits the solution: wait for the server's verdict before
    // freezing the board, so an invalid full board can be corrected and submitted again.
    if (solutionBoard) {
      completedRef.current = true;
      setIsCompleted(true);
      try { await onCompleteRef.current?.(info); } catch { /* UI/API layer reports the error. */ }
      return;
    }

    validatingRef.current = true;
    setIsValidating(true);
    try {
      const accepted = await onCompleteRef.current?.(info);
      if (accepted === false) {
        validatingRef.current = false;
        setIsValidating(false);
        return;
      }
      completedRef.current = true;
      setIsCompleted(true);
    } catch {
      validatingRef.current = false;
      setIsValidating(false);
    }
  }, [solutionBoard]);

  const togglePause = useCallback(() => {
    setIsPaused((currentlyPaused) => {
      if (!currentlyPaused) pauseStartRef.current = Date.now();
      else if (pauseStartRef.current !== null) {
        pausedAccumRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      return !currentlyPaused;
    });
  }, []);

  const select = useCallback((index: number) => {
    if (index >= 0 && index < TOTAL_CELLS) setSelected(index);
  }, []);

  const inputDigit = useCallback((value: CellValue) => {
    const currentSelected = selected;
    const currentBoard = boardRef.current;
    const currentNotes = notesRef.current;
    if (currentSelected === null || isCompleted || isDefeated || isPaused || validatingRef.current || fixedMask[currentSelected]) return;

    if (mode === "note") {
      const nextNotes = cloneNotes(currentNotes);
      if (value === 0) nextNotes[currentSelected].clear();
      else if (nextNotes[currentSelected].has(value)) nextNotes[currentSelected].delete(value);
      else nextNotes[currentSelected].add(value);
      notesRef.current = nextNotes;
      setNotes(nextNotes);
      pushHistory(currentBoard, nextNotes);
      return;
    }

    const nextBoard = currentBoard.slice();
    nextBoard[currentSelected] = value;
    const nextNotes = cloneNotes(currentNotes);
    nextNotes[currentSelected].clear();
    boardRef.current = nextBoard;
    notesRef.current = nextNotes;
    setBoard(nextBoard);
    setNotes(nextNotes);
    pushHistory(nextBoard, nextNotes);

    let nextMistakes = mistakes;
    if (value !== 0 && solutionBoard && solutionBoard[currentSelected] !== value) {
      nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setWrongCells((prev) => new Set(prev).add(currentSelected));
      if (nextMistakes >= maxMistakes) setIsDefeated(true);
    } else {
      setWrongCells((prev) => {
        if (!prev.has(currentSelected)) return prev;
        const copy = new Set(prev);
        copy.delete(currentSelected);
        return copy;
      });
    }
    complete(nextBoard, nextMistakes, hintsUsed);
  }, [selected, isCompleted, isDefeated, isPaused, fixedMask, mode, pushHistory, mistakes, solutionBoard, maxMistakes, complete, hintsUsed]);

  const erase = useCallback(() => {
    const currentSelected = selected;
    if (currentSelected === null || isCompleted || isDefeated || isPaused || validatingRef.current || fixedMask[currentSelected]) return;
    const currentBoard = boardRef.current;
    const currentNotes = notesRef.current;
    if (currentBoard[currentSelected] === 0 && currentNotes[currentSelected].size === 0) return;

    const nextBoard = currentBoard.slice();
    nextBoard[currentSelected] = 0;
    const nextNotes = cloneNotes(currentNotes);
    nextNotes[currentSelected].clear();
    boardRef.current = nextBoard;
    notesRef.current = nextNotes;
    setBoard(nextBoard);
    setNotes(nextNotes);
    setWrongCells((prev) => {
      if (!prev.has(currentSelected)) return prev;
      const copy = new Set(prev);
      copy.delete(currentSelected);
      return copy;
    });
    pushHistory(nextBoard, nextNotes);
  }, [selected, isCompleted, isDefeated, isPaused, fixedMask, pushHistory]);

  const moveHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = historyIndexRef.current + direction;
    if (nextIndex < 0 || nextIndex >= historyRef.current.length) return;
    const entry = historyRef.current[nextIndex];
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    const nextBoard = entry.board.slice();
    const nextNotes = cloneNotes(entry.notes);
    boardRef.current = nextBoard;
    notesRef.current = nextNotes;
    setBoard(nextBoard);
    setNotes(nextNotes);
    setWrongCells(new Set());
  }, []);
  const undo = useCallback(() => moveHistory(-1), [moveHistory]);
  const redo = useCallback(() => moveHistory(1), [moveHistory]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const restart = useCallback(() => resetPuzzle(), [resetPuzzle]);

  const useHint = useCallback(() => {
    if (!solutionBoard || hintsUsed >= maxHints || isCompleted || isDefeated || isPaused || validatingRef.current) return;
    const currentBoard = boardRef.current;
    const target = selected !== null && currentBoard[selected] === 0 && !fixedMask[selected]
      ? selected
      : currentBoard.findIndex((v, i) => v === 0 && !fixedMask[i]);
    if (target < 0) return;
    const nextBoard = currentBoard.slice();
    nextBoard[target] = solutionBoard[target];
    const nextNotes = cloneNotes(notesRef.current);
    nextNotes[target].clear();
    boardRef.current = nextBoard;
    notesRef.current = nextNotes;
    setBoard(nextBoard);
    setNotes(nextNotes);
    setHintsUsed((prev) => prev + 1);
    setHintedCells((prev) => new Set(prev).add(target));
    setWrongCells((prev) => { const copy = new Set(prev); copy.delete(target); return copy; });
    pushHistory(nextBoard, nextNotes);
    complete(nextBoard, mistakes, hintsUsed + 1);
  }, [solutionBoard, hintsUsed, maxHints, isCompleted, isDefeated, isPaused, selected, fixedMask, pushHistory, complete, mistakes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
        if (event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
        return;
      }
      if (/^[1-9]$/.test(event.key)) { event.preventDefault(); inputDigit(Number(event.key) as CellValue); }
      else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") { event.preventDefault(); erase(); }
      else if (event.key === "ArrowUp" && selected !== null) { event.preventDefault(); select(Math.max(0, selected - 9)); }
      else if (event.key === "ArrowDown" && selected !== null) { event.preventDefault(); select(Math.min(80, selected + 9)); }
      else if (event.key === "ArrowLeft" && selected !== null) { event.preventDefault(); select(Math.max(0, selected - 1)); }
      else if (event.key === "ArrowRight" && selected !== null) { event.preventDefault(); select(Math.min(80, selected + 1)); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inputDigit, erase, undo, redo, selected, select]);

  const conflicts = useMemo(() => findConflicts(board), [board]);
  const filledCount = useMemo(() => countFilledCells(board), [board]);
  const relatedCells = useMemo(() => {
    if (selected === null) return new Set<number>();
    const r = rowOf(selected), c = colOf(selected), b = boxOf(selected);
    const set = new Set<number>();
    for (let i = 0; i < TOTAL_CELLS; i++) if (rowOf(i) === r || colOf(i) === c || boxOf(i) === b) set.add(i);
    return set;
  }, [selected]);
  const sameValueCells = useMemo(() => {
    if (selected === null || board[selected] === 0) return new Set<number>();
    const value = board[selected];
    return new Set(board.flatMap((v, i) => v === value ? [i] : []));
  }, [selected, board]);
  const timer = elapsedMs;

  return {
    board, notes, history, historyIndex, givensBoard, fixedMask, selected, select, mode, setMode,
    inputDigit, erase, undo, redo, canUndo, canRedo, restart, useHint, hintsUsed, hints: hintsUsed,
    maxHints, hintedCells, mistakes, maxMistakes, wrongCells, conflicts, isComplete: isCompleted,
    isCompleted, isValidating, isDefeated, isPaused, togglePause, elapsedMs, timer, filledCount, relatedCells,
    sameValueCells, cellIndex,
  };
}
