import { createContext } from "react";

export type ChapterStageBindings = {
  setFrame: (node: HTMLDivElement | null) => void;
  setMotion: (node: HTMLDivElement | null) => void;
};
export const ChapterStageContext = createContext<ChapterStageBindings | null>(null);
