import { useGameStore } from '../store/gameStore';

export default function GameOver() {
  const round = useGameStore((s) => s.round);
  const relics = useGameStore((s) => s.relics);
  const restart = useGameStore((s) => s.restart);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-[10px] uppercase tracking-[0.6em] text-rose-300/50">
        the last star gutters
      </p>
      <h1
        className="mt-3 font-display text-6xl tracking-[0.18em] text-rose-200/90"
        style={{ textShadow: '0 0 44px rgba(251,113,133,0.4)' }}
      >
        EXTINGUISHED
      </h1>
      <div className="rule-thin my-8 w-64" />
      <p className="text-[11px] uppercase tracking-[0.36em] text-purple-200/50">
        Floor {round} · {relics.length} relic{relics.length === 1 ? '' : 's'} gathered
      </p>
      <button onClick={restart} className="btn-astral btn-gold mt-10 !px-8 !py-3 !text-[12px]">
        Rekindle the Cosmos
      </button>
    </div>
  );
}