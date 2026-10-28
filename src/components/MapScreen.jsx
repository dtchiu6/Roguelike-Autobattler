import { useGameStore } from '../store/gameStore';

const TONE = {
  violet: { ring: 'border-purple-300/40', glow: 'hover:shadow-glow-violet', text: 'text-astral-violet' },
  rose:   { ring: 'border-rose-300/40',   glow: 'hover:shadow-[0_0_26px_rgba(251,113,133,0.35)]', text: 'text-rose-200' },
  cyan:   { ring: 'border-cyan-300/40',   glow: 'hover:shadow-glow-cyan', text: 'text-astral-cyan' },
};

export default function MapScreen() {
  const nodes = useGameStore((s) => s.mapNodes);
  const lastResult = useGameStore((s) => s.lastResult);
  const chooseNode = useGameStore((s) => s.chooseNode);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1100px] flex-col items-center justify-center px-6">
      <p className="mb-1 font-display text-[10px] uppercase tracking-[0.5em] text-purple-300/50">
        {lastResult?.won === false ? 'Your light wavers…' : 'The path unfolds'}
      </p>
      <h1 className="mb-10 font-display text-3xl tracking-[0.2em] text-slate-100">
        ASTRAL CONFLUENCE
      </h1>

      <div className="relative flex w-full items-center justify-between gap-6">
        {/* Decorative connector */}
        <svg className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-2 w-full -translate-y-1/2 opacity-40">
          <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="url(#g)" strokeWidth="1" strokeDasharray="4 8" />
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#b9a3ff" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {nodes.map((node) => {
          const tone = TONE[node.tone] ?? TONE.violet;
          return (
            <button
              key={node.id}
              onClick={() => chooseNode(node.id)}
              className={[
                'panel group flex flex-1 flex-col items-center gap-3 px-5 py-8 transition-all duration-300 ease-out',
                'hover:-translate-y-1.5',
                tone.ring, tone.glow,
              ].join(' ')}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border bg-slate-950/50 text-2xl transition-transform duration-300 group-hover:scale-110 ${tone.ring} ${tone.text}`}>
                {node.glyph}
              </div>
              <h3 className="font-display text-[12px] uppercase tracking-[0.24em] text-slate-100">
                {node.label}
              </h3>
              <div className="rule-thin w-14" />
              <p className="text-center text-[10px] leading-relaxed text-purple-200/55">
                {node.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}