import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const STEP_MS = 50;              // simulation granularity (20 ticks / sec)
const MAX_STEPS_PER_FRAME = 8;   // spiral-of-death guard

/**
 * Drives the combat simulation with requestAnimationFrame but advances it in
 * FIXED steps. This decouples simulation speed from display refresh rate, so a
 * 144Hz monitor and a 60Hz monitor produce identical fights.
 */
export function useCombatLoop() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase !== 'COMBAT') return undefined;

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let cancelled = false;

    const frame = (now) => {
      if (cancelled) return;
      const state = useGameStore.getState();
      if (state.phase !== 'COMBAT') return; // phase machine already advanced

      // Clamp the delta so tab-switching never causes a huge catch-up burst
      accumulator += Math.min(now - last, 250);
      last = now;

      const speed = state.ui.speed ?? 1;
      let steps = 0;

      while (
        accumulator >= STEP_MS &&
        steps < MAX_STEPS_PER_FRAME &&
        useGameStore.getState().phase === 'COMBAT'
      ) {
        useGameStore.getState().tickCombat(STEP_MS * speed);
        accumulator -= STEP_MS;
        steps += 1;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);
}