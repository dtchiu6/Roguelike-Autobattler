import { UNIT_TEMPLATES } from '../data/units';
import { useGameStore } from '../store/gameStore';

export default function Bench() {
  const bench = useGameStore((s) => s.bench);
  const selected = useGameStore((s) => s.ui.selected);
  const phase = useGameStore((s) => s.phase);
  const clickBenchSlot = useGameStore((s) => s.clickBenchSlot);
  const dropAt = useGameStore((s) => s.dropAt);
  const sellAt = useGameStore((s) => s.sellAt);

  const canEdit = phase === 'SHOP';

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('application/astral-loc', JSON.stringify({ type: 'bench', index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/astral-loc');
    if (!raw) return;
    try { dropAt(JSON.parse(raw), { type: 'bench', index }); } catch { /* noop */ }
  };

  return (
    <div className="panel panel-cut mt-3 px-4 py-3">
      <div className="mb-2 flex items-center gap-3">
        <span className="font-display text-[10px] uppercase tracking-[0.34em] text-purple-300/70">
          Starlight Bench
        </span>
        <div className="rule-thin flex-1" />
      </div>

      <div className="grid grid-cols-8 gap-2">
        {bench.map((unit, index) => {
          const tpl = unit ? UNIT_TEMPLATES[unit.tplId] : null;
          const isSelected =
            selected?.type === 'bench' && selected.index === index;

          return (
            <div
              key={index}
              draggable={canEdit && !!unit}
              onDragStart={(e) => unit && handleDragStart(e, index)}
              onDragOver={(e) => canEdit && e.preventDefault()}
              onDrop={(e) => canEdit && handleDrop(e, index)}
              onClick={() => canEdit && clickBenchSlot(index)}
              className={[
                'group relative flex h-[74px] flex-col items-center justify-center gap-1 border transition-all duration-300 ease-out panel-cut',
                unit
                  ? 'cursor-pointer border-purple-400/30 bg-purple-500/[0.07] hover:-translate-y-[2px] hover:border-cyan-300/60 hover:shadow-glow-cyan'
                  : 'border-dashed border-purple-400/15 bg-slate-950/30',
                isSelected && 'border-cyan-300/80 bg-cyan-400/10 shadow-glow-cyan -translate-y-[2px]',
              ].join(' ')}
            >
              {unit && tpl ? (
                <>
                  <span
                    className="text-lg leading-none"
                    style={{ color: tpl.accent, textShadow: `0 0 10px ${tpl.accent}` }}
                  >
                    {tpl.glyph}
                  </span>
                  <span className="px-1 text-center text-[8px] uppercase leading-tight tracking-[0.1em] text-slate-300/80">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] text-astral-gold">◈ {tpl.cost}</span>

                  {/* Sell affordance */}
                  <button
                    onClick={(e) => { e.stopPropagation(); sellAt({ type: 'bench', index }); }}
                    title={`Sell for ${tpl.cost} gold`}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border border-rose-400/50 bg-slate-950 text-[9px] text-rose-300 transition-all hover:bg-rose-500/30 group-hover:flex"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-[9px] uppercase tracking-[0.2em] text-purple-300/20">empty</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}