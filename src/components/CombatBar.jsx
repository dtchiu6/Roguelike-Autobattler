import { useGameStore } from '../store/gameStore';

/** Combat HUD: live log, speed toggle, and the victory/defeat banner. */
export default function CombatBar() {
  const combat = useGameStore((s) => s.combat);
  const speed = useGameStore((s) => s.ui.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);

  if (!combat) return null;

  const banner =
    combat.status === 'victory'
      ? { text: 'VICTORY', cls: 'text-astral-gold border-astral-gold/60 shadow-glow-gold' }
      : combat.status === 'defeat'
        ? { text: 'DEFEAT', cls: 'text-rose-300 border-rose-400/60' }
        : null;

  return (
    <div className="panel panel-cut mt-3 flex items-center gap-4 px-4 py-2">
      {/* Log */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 font-display text-[9px] uppercase tracking-[0.34em] text-purple-300/50">
          Celestial Record
        </div>
        <div className="flex flex-col gap-[2px]">
          {combat.log.slice(-2).map((entry) => (
            <p
              key={entry.id}
              className={`truncate text-[10px] ${
                entry.team === 'player' ? 'text-cyan-200/70' : 'text-rose-200/60'
              }`}
            >
              › {entry.text}
            </p>
          ))}
          {combat.log.length === 0 && (
            <p className="text-[10px] italic text-slate-600">The constellations hold their breath…</p>
          )}
        </div>
      </div>

      <div className="rule-thin h-8 w-px flex-none bg-purple-400/20" />

      {/* Speed */}
      <div className="flex items-center gap-1">
        {[1, 2].map((v) => (
          <button
            key={v}
            onClick={() => setSpeed(v)}
            className={[
              'btn-astral !px-2 !py-1 !text-[9px]',
              speed === v ? 'border-cyan-300/70 text-cyan-200 shadow-glow-cyan' : '',
            ].join(' ')}
          >
            {v}×
          </button>
        ))}
      </div>

      {/* Result banner */}
      {banner && (
        <div
          className={`animate-pulse-slow border px-4 py-1 font-display text-[12px] tracking-[0.4em] panel-cut ${banner.cls}`}
        >
          {banner.text}
        </div>
      )}
    </div>
  );
}