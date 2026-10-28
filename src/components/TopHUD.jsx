import { useGameStore } from '../store/gameStore';
import { RELIC_MAP } from '../data/relics';

export default function TopHUD() {
  const round = useGameStore((s) => s.round);
  const gold = useGameStore((s) => s.gold);
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const relics = useGameStore((s) => s.relics);
  const encounter = useGameStore((s) => s.encounter);

  const hpPct = Math.max(0, (hp / maxHp) * 100);

  return (
    <header className="panel panel-cut relative z-20 mx-auto mb-4 flex w-full max-w-[1400px] items-center gap-6 px-6 py-3">
      {/* Floor emblem */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center border border-astral-gold/40 bg-amber-400/5 text-astral-gold panel-cut">
          <span className="font-display text-lg">{round}</span>
          <span className="absolute -bottom-2 text-[8px] uppercase tracking-[0.28em] text-astral-gold/60">
            floor
          </span>
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm tracking-[0.22em] text-slate-200">ASTRAL ASCENDANT</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300/60">
            {encounter === 'elite' ? 'Eclipse Elite' : 'Astral Skirmish'}
          </p>
        </div>
      </div>

      <div className="rule-thin flex-1" />

      {/* Vitality */}
      <div className="w-[240px]">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.28em]">
          <span className="text-purple-300/70">Vitality</span>
          <span className="text-astral-cyan">{hp} / {maxHp}</span>
        </div>
        <div className="h-[7px] w-full overflow-hidden border border-purple-400/25 bg-slate-950/70">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-cyan-200 to-amber-200 transition-all duration-500 ease-out"
            style={{ width: `${hpPct}%`, boxShadow: '0 0 12px rgba(140,232,247,0.7)' }}
          />
        </div>
      </div>

      {/* Gold */}
      <div className="flex items-center gap-2 border border-astral-gold/40 bg-amber-400/5 px-4 py-1.5 panel-cut">
        <span className="text-astral-gold text-lg leading-none">◈</span>
        <span className="font-display text-lg text-astral-gold tabular-nums">{gold}</span>
      </div>

      {/* Relics */}
      <div className="flex items-center gap-1.5">
        {relics.length === 0 && (
          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">no relics</span>
        )}
        {relics.map((id) => {
          const relic = RELIC_MAP[id];
          if (!relic) return null;
          return (
            <div
              key={id}
              title={`${relic.name} — ${relic.desc}`}
              className="group relative flex h-8 w-8 items-center justify-center border border-cyan-300/25 bg-cyan-400/5 text-astral-cyan transition-all duration-300 hover:border-cyan-300/70 hover:shadow-glow-cyan panel-cut"
            >
              <span className="text-sm">{relic.glyph}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
}