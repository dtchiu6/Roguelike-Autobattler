import {
  UNIT_TEMPLATES, RANKS, RANK_COST_MULT, offerCost,
} from '../data/units';
import { useGameStore } from '../store/gameStore';
import RankBadge from './RankBadge';

export default function ShopPanel() {
  const offers = useGameStore((s) => s.shop.offers);
  const locked = useGameStore((s) => s.shop.locked);
  const gold = useGameStore((s) => s.gold);
  const buyOffer = useGameStore((s) => s.buyOffer);
  const rerollShop = useGameStore((s) => s.rerollShop);
  const toggleLock = useGameStore((s) => s.toggleLock);
  const startCombat = useGameStore((s) => s.startCombat);

  return (
    <aside className="panel panel-cut flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[11px] uppercase tracking-[0.34em] text-purple-200/80">
          Astral Summon
        </h2>
        <button
          onClick={toggleLock}
          className={[
            'btn-astral !px-2 !py-1 !text-[9px]',
            locked ? 'border-astral-gold/70 bg-amber-400/15 text-astral-gold' : '',
          ].join(' ')}
        >
          {locked ? '🔒 Locked' : 'Lock'}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {offers.map((offer, index) => {
          if (!offer) {
            return (
              <div
                key={index}
                className="flex h-[72px] items-center justify-center border border-dashed border-purple-400/10 bg-slate-950/20 text-[9px] uppercase tracking-[0.28em] text-purple-300/15 panel-cut"
              >
                summoned
              </div>
            );
          }

          const tpl = UNIT_TEMPLATES[offer.tplId];
          const rank = offer.rank ?? 0;
          const cost = offerCost(offer);
          const affordable = gold >= cost;
          const isUpgraded = rank > 0;

          return (
            <button
              key={offer.uid}
              disabled={!affordable}
              onClick={() => buyOffer(index)}
              className={[
                'group relative flex items-center gap-3 border px-3 py-2 text-left panel-cut transition-all duration-300 ease-out',
                affordable
                  ? 'border-purple-400/25 bg-purple-500/[0.06] hover:-translate-y-[2px] hover:border-cyan-300/70 hover:bg-cyan-400/[0.08] hover:shadow-glow-cyan'
                  : 'cursor-not-allowed border-purple-400/10 bg-slate-950/30 opacity-45',
                isUpgraded && 'border-astral-gold/40',
              ].join(' ')}
            >
              {/* Glyph medallion with rank pip */}
              <div className="relative shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{
                    borderColor: `${tpl.accent}66`,
                    background: `radial-gradient(circle at 50% 30%, ${tpl.accent}1f, rgba(5,3,15,0.9) 70%)`,
                    color: tpl.accent,
                    boxShadow: `0 0 14px ${tpl.accent}33`,
                  }}
                >
                  <span className="text-base" style={{ textShadow: `0 0 10px ${tpl.accent}` }}>
                    {tpl.glyph}
                  </span>
                </div>
                <RankBadge rank={rank} size={15} className="absolute -bottom-1 -right-1" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate font-display text-[11px] tracking-[0.1em] text-slate-100">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] text-astral-violet/70">
                    {'★'.repeat(tpl.tier)}
                  </span>
                </div>
                <p className="truncate text-[9px] leading-tight text-purple-200/45">
                  {tpl.ability.name}
                </p>
                <p className="text-[9px] text-slate-400/60">
                  {tpl.maxHp} HP · {tpl.attack} ATK · RNG {tpl.range}
                </p>
              </div>

              <div className={[
                'flex shrink-0 items-center gap-1 border px-2 py-1 panel-cut',
                isUpgraded
                  ? 'border-astral-gold/50 bg-amber-400/10 text-astral-gold'
                  : 'border-astral-gold/40 bg-amber-400/10 text-astral-gold',
              ].join(' ')}>
                <span className="text-[10px]">◈</span>
                <span className="font-display text-[11px] tabular-nums">{cost}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <button onClick={rerollShop} disabled={gold < 2} className="btn-astral w-full">
          Reroll · ◈ 2
        </button>
        <button
          onClick={startCombat}
          className="btn-astral btn-gold w-full !py-3 !text-[12px]"
        >
          Begin Ascension
        </button>
      </div>
    </aside>
  );
}