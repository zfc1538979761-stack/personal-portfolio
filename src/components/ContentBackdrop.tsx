import { lazy, Suspense, useRef } from 'react';
import { useNearViewport } from './useNearViewport';
const Grainient = lazy(() => import('./Grainient'));
const colors = ['#101213', '#14212D', '#244257', '#637D8A'];

export function ContentBackdrop({ suspended }: { suspended: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  // It begins exactly below the Hero. A negative margin avoids compiling GL
  // while that boundary merely touches the bottom edge during the opening.
  const near = useNearViewport(host, '-64px 0px');
  return <div className="content-backdrop" aria-hidden="true" ref={host}>
    {near && <Suspense fallback={null}><Grainient
      colors={colors} angle={20} flow={.9} silk={.35} grainAmount={.08}
      speed={suspended ? 0 : .35} grainAnimated={!suspended} interactive={!suspended}
      stir={.3} clickSwirl={false} intro={false} dpr={1} suspended={suspended}
    /></Suspense>}
  </div>;
}
