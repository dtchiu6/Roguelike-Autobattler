import { RANKS, RANK_COLORS } from '../data/units';

/**
 * Tiny circular rank pip. Place next to any unit's glyph.
 * `size` accepts 12 (shop), 16 (bench), 14 (combat token).
 */
export default function RankBadge({ rank = 0, size = 14, className = '' }) {
  const color = RANK_COLORS[rank];
  const isS = rank === RANKS.length - 1;

  return (
    <span
      className={`pointer-events-none flex items-center justify-center rounded-full border bg-slate-950/95 font-display font-semibold leading-none ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: `${color}aa`,
        color,
        fontSize: Math.round(size * 0.62),
        boxShadow: isS
          ? `0 0 10px ${color}, 0 0 18px ${color}66`
          : `0 0 6px ${color}55`,
        textShadow: `0 0 6px ${color}aa`,
      }}
    >
      {RANKS[rank]}
    </span>
  );
}