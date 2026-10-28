import { useMemo } from 'react';

/** Cheap decorative starfield — memoised so it never re-renders. */
export default function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 5,
        opacity: 0.2 + Math.random() * 0.6,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-pulse-slow"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: '0 0 6px rgba(190,220,255,0.9)',
          }}
        />
      ))}
      <div className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-purple-600/10 blur-[140px] animate-drift" />
      <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[130px] animate-drift" />
    </div>
  );
}