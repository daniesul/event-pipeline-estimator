import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Short ease-out tween toward `target`. Purely visual — screen readers get
 * the final value through a separate live region.
 */
export function useAnimatedNumber(target: number, duration = 450): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;
    if (prefersReducedMotion()) {
      fromRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const value = from + (safeTarget - from) * eased;
      fromRef.current = value;
      setDisplay(value);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}
