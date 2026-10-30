import { create } from "zustand";

/**
 * Load state shared by the preloader, the scene that feeds it and the content
 * that waits for it.
 *
 * 📖 Docs: obsidian/frontend/hooks.md
 */
export interface UsePreloader {
  /** Real load progress reported by the page's heavy assets, 0–1. */
  progress: number;
  /** Everything the preloader waits for has finished. */
  ready: boolean;
  /** The preloader has started leaving — reveal animations key off this. */
  revealed: boolean;
  /** `performance.now()` when `revealed` flipped — entrances count their delay from it. */
  revealedAt: number | null;
  setProgress: (progress: number) => void;
  markReady: () => void;
  reveal: () => void;
}

export const usePreloader = create<UsePreloader>((set) => ({
  progress: 0,
  ready: false,
  revealed: false,
  revealedAt: null,
  // Progress never goes backwards: a loader that discovers more requests
  // mid-flight (the Draco decoder) would otherwise pull the bar back.
  setProgress: (progress) =>
    set((state) => ({ progress: Math.max(state.progress, Math.min(progress, 1)) })),
  markReady: () => set({ ready: true, progress: 1 }),
  reveal: () =>
    set((state) => (state.revealed ? state : { revealed: true, revealedAt: performance.now() })),
}));
