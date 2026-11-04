import { useContext } from "react";
import type { ReactNode } from "react";
import { ChapterStageContext } from "./chapterStageContext";
import "./ChapterTransition.css";

export function ChapterPhotoStage({ children }: { children: ReactNode }) {
  const bindings = useContext(ChapterStageContext);
  if (!bindings) return <>{children}</>;
  const { setFrame, setMotion } = bindings;
  return (
    <div className="chapter-photo-window" ref={setFrame}>
      <div className="chapter-photo-motion" ref={setMotion}>{children}</div>
    </div>
  );
}
