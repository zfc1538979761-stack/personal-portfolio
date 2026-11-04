// Directional edge light and pointer tilt share one fixed hit rectangle.
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { usePointerTilt } from "./usePointerTilt";
import "./BorderGlow.css";
const glowStyle = {
  "--card-bg": "#1d2327", "--edge-sensitivity": 30, "--glow-padding": "12px",
  "--cone-spread": 18, "--glow-ink": "198deg 90% 76%",
} as CSSProperties;
export function BorderGlow({ children, className = "", tiltEnabled = true }: { children: ReactNode; className?: string; tiltEnabled?: boolean }) {
  const card=useRef<HTMLElement>(null),surface=useRef<HTMLDivElement>(null);
  usePointerTilt(card,surface,{kind:'strength',enabled:tiltEnabled,edge:true,
    onPoint:p=>{surface.current?.style.setProperty('--edge-proximity',p.proximity.toFixed(3));surface.current?.style.setProperty('--cursor-angle',`${p.angle.toFixed(3)}deg`);},
    onReset:()=>surface.current?.style.setProperty('--edge-proximity','0')});
  return <article ref={card} className={`border-glow-hit ${className}`}>
    <div ref={surface} className="border-glow-card strength-card-surface" style={glowStyle}>
      <span className="edge-light" aria-hidden="true" />{children}
    </div>
  </article>;
}
