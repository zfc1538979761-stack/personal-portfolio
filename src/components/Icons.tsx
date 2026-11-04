import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement>;
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};
export function Arrow(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}
export function Chevron(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
export function Plus(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function Pause(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}
export function Play(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m8 5 11 7-11 7Z" />
    </svg>
  );
}
export function Check(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
