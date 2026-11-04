import type { ReactNode } from "react";

export function SectionLabel({ number, english, children }: { number: string; english: string; children: ReactNode }) {
  return (
    <div className="section-label chapter-heading">
      <div className="chapter-meta"><span>{number} /</span></div>
      <p className="chapter-title" aria-hidden="true">
        {english.split(" ").map((word, index) => (
          <span className="chapter-word-mask" key={`${word}-${index}`}><span className="chapter-word">{word}</span></span>
        ))}
      </p>
      <p className="chapter-subtitle">{children}</p>
    </div>
  );
}
