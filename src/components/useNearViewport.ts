import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// One-way gate: don't unload/redecode gallery photos while scrolling past them.
export function useNearViewport(ref: RefObject<Element | null>, margin = '600px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true); observer.disconnect();
      }
    }, { rootMargin: margin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, margin, near]);
  return near;
}
