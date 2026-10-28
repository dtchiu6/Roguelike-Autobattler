import { UNIT_TEMPLATES, MERGE_COUNT } from '../data/units';
import RankBadge from './RankBadge';

const ARENA_COLS = 9;
const ARENA_ROWS = 4;

/**
 * A single celestial medallion on the arena.
 * Now renders a rank badge and — during shop phase — a "2/3" progress pill
 * when the unit is one copy away from merging.
 */
export default function UnitToken({
  unit, combatTime, preview, duplicateCount, onClick, onDragStart,
}) {
  const tpl = UNIT_TEMPLATES[unit.tplId];
  if (!tpl) return null;

  const maxHp = unit.maxHp ?? tpl.maxHp;
  const hp = unit.hp ?? maxHp;
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const manaPct = unit.maxMana ? Math.max(0, (unit.mana / unit.maxMana) * 100) : 0;
  const isPlayer = unit.team !== 'enemy';
  const dead = unit.alive === false;
  const rank = unit.rank ?? 0;

  const lunging = combatTime != null && combatTime - (unit.lastAttack ?? -9999) < 180;

  const left = ((unit.col + 0.5) / ARENA_COLS) * 100;
  const top = ((unit.row + 0.5) / ARENA_ROWS) * 100;

  // Only show progress when the caller supplies a count (shop phase).
  const showProgress =
    duplicateCount != null && duplicateCount >= 2 && duplicateCount < MERGE_COUNT;

  return (
    <div
      draggable={!!onDragStart && !dead}
      onDragStart={onDragStart}
      onClick={onClick}
      className="group absolute z-10 cursor-pointer transition-all duration-500 ease-out"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        opacity: dead ? 0.15 : preview ? 0.55 : 1,
      }}
    >
      <div className={`flex flex-col items-center ${lunging ? 'animate-lunge' : ''}`}>
        {/* Medallion */}
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 ease-out group-hover:scale-110"
          style={{
            borderColor: `${tpl.accent}66`,
            background: `radial-gradient(circle at 50% 30%, ${tpl.accent}22, rgba(5,3,15,0.9) 70%)`,
            boxShadow: `0 0 16px ${tpl.accent}44, inset 0 0 14px ${tpl.accent}22`,
            color: tpl.accent,
          }}
        >
          <span className="text-lg leading-none" style={{ textShadow: `0 0 10px ${tpl.accent}` }}>
            {tpl.glyph}
          </span>
          <RankBadge rank={rank} size={14} className="absolute -right-2 -top-2" />
          {unit.shield > 0 && (
            <span className="absolute -left-1 -top-1 rounded-full border border-cyan-300/60 bg-slate-950/90 px-1 text-[8px] text-cyan-200">
              {Math.round(unit.shield)}
            </span>
          )}
        </div>

        {/* HP bar */}
        <div className="mt-1 h-[4px] w-12 overflow-hidden border border-slate-800/80 bg-slate-950/80">
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{
              width: `${hpPct}%`,
              background: isPlayer
                ? 'linear-gradient(90deg,#34d399,#a7f3d0)'
                : 'linear-gradient(90deg,#fb7185,#fda4af)',
            }}
          />
        </div>

        {/* Mana bar */}
        {unit.maxMana != null && (
          <div className="mt-[2px] h-[3px] w-12 overflow-hidden bg-slate-950/80">
            <div
              className="h-full bg-astral-cyan transition-all duration-200 ease-out"
              style={{ width: `${manaPct}%`, boxShadow: '0 0 8px rgba(140,232,247,0.8)' }}
            />
          </div>
        )}

        {/* Merge-progress badge (shop phase only) */}
        {showProgress && (
          <span className="mt-[2px] rounded-full border border-astral-gold/50 bg-slate-950/85 px-1.5 text-[8px] font-display leading-tight tabular-nums text-astral-gold">
            {duplicateCount}/{MERGE_COUNT}
          </span>
        )}
      </div>
    </div>
  );
}