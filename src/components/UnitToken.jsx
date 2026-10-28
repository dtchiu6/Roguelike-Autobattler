import { UNIT_TEMPLATES } from '../data/units';

const ARENA_COLS = 9;
const ARENA_ROWS = 4;

/**
 * A single celestial medallion on the arena.
 * Rendered with absolute % coordinates so CSS can tween movement.
 */
export default function UnitToken({ unit, combatTime, preview, onClick, onDragStart }) {
  const tpl = UNIT_TEMPLATES[unit.tplId];
  if (!tpl) return null;

  const maxHp = unit.maxHp ?? tpl.maxHp;
  const hp = unit.hp ?? maxHp;
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const manaPct = unit.maxMana ? Math.max(0, (unit.mana / unit.maxMana) * 100) : 0;
  const isPlayer = unit.team !== 'enemy';
  const dead = unit.alive === false;

  // Attack lunge animation for a brief window after each swing
  const lunging = combatTime != null && combatTime - (unit.lastAttack ?? -9999) < 180;

  const left = ((unit.col + 0.5) / ARENA_COLS) * 100;
  const top = ((unit.row + 0.5) / ARENA_ROWS) * 100;

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
          {unit.shield > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full border border-cyan-300/60 bg-slate-950/90 px-1 text-[8px] text-cyan-200">
              {Math.round(unit.shield)}
            </span>
          )}
          {!isPlayer && (
            <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-rose-400/80" />
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
      </div>
    </div>
  );
}