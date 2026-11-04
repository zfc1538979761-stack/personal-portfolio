export function motionPolicy(width: number, reduced: boolean, hash: string, scrollY: number) {
  const compact = width < 1024;
  return {
    opening: !reduced && (!hash || hash === "#home") && scrollY < 32,
    parallax: !reduced && !compact,
    rotation: reduced || compact ? 0 : 58,
    timeScale: compact ? .75 : 1,
    travel: compact ? 72 : 150,
  };
}
