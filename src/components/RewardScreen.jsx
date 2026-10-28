import { RELIC_MAP } from '../data/relics';
import { useGameStore } from '../store/gameStore';

export default function RewardScreen() {
  const choices = useGameStore((s) => s.rewardChoices);
  const lastResult = useGameStore((s) => s.lastResult);
  const chooseRelic = useGameStore((s) => s.chooseRelic);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1100px] flex-col items-center justify-center px-6">
      <p className="mb-1 font-display text-[10px] uppercase tracking-[0.5em] text-cyan-300/60">
        The constellation yields
      </p>
      <h1 className="mb-2 font-display text-4xl tracking-[0.16em] text-astral-gold"
          style={{ textShadow: '0 0 32px rgba(243,215,155,0.45)' }}>
        CELESTIAL SPOILS
      </h1>
      <p className="mb-8 text-[11px] uppercase tracking-[0.34em] text-purple-200/50">
        + {lastResult?.gold ?? 0} gold acquired · choose a relic
      </p>

      <div className="grid w-full grid-cols-3 gap-4">
        {choices.map((id, i) => {
          const relic = RELIC_MAP[id];
          if (!relic) return null;
          return (
            <button
              key={id}
              onClick={() => chooseRelic(id)}
              className="panel group flex flex-col items-center gap-3 px-5 py-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-300/70 hover:shadow-glow-cyan"
              style={{ animation: `floatUp 0ms`, animationDelay: `${i * 90}ms` }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/5 text-3xl text-astral-cyan transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-cyan"
                   style={{ textShadow: '0 0 22px rgba(140,232,247,0.9)' }}>
                {relic.glyph}
              </div>
              <h3 className="font-display text-sm tracking-[0.16em] text-slate-100">{relic.name}</h3>
              <div className="rule-thin w-16" />
              <p className="text-center text-[11px] leading-relaxed text-purple-200/60">
                {relic.desc}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => chooseRelic(null)}
        className="btn-astral mt-8 !text-[10px] text-purple-200/60"
      >
        Refuse · gain ◈ 3
      </button>
    </div>
  );
}