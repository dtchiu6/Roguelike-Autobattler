import { uid } from '../utils/id';

export const UNIT_TEMPLATES = {
  seraph: {
    id: 'seraph', name: 'Seraphic Vanguard', cost: 1, tier: 1,
    glyph: '✧', accent: '#f3d79b',
    maxHp: 640, attack: 52, attackSpeed: 0.85, range: 1, maxMana: 70,
    ability: { name: 'Radiant Cleave', type: 'aoe', power: 95, radius: 1, shield: 90,
      desc: 'Cleaves nearby foes for 95 and shields self for 90.' },
  },
  archer: {
    id: 'archer', name: 'Astral Archer', cost: 1, tier: 1,
    glyph: '➶', accent: '#8ce8f7',
    maxHp: 420, attack: 62, attackSpeed: 1.15, range: 3, maxMana: 60,
    ability: { name: 'Piercing Starlight', type: 'single', power: 210,
      desc: 'Fires a star-arrow for 210 damage.' },
  },
  lumina: {
    id: 'lumina', name: 'Lumina Adept', cost: 1, tier: 1,
    glyph: '✶', accent: '#c4b5fd',
    maxHp: 450, attack: 55, attackSpeed: 1.0, range: 3, maxMana: 55,
    ability: { name: 'Nova Lance', type: 'single', power: 175,
      desc: 'Impales a foe for 175 astral damage.' },
  },
  starweaver: {
    id: 'starweaver', name: 'Starweaver', cost: 2, tier: 2,
    glyph: '❉', accent: '#7dd3fc',
    maxHp: 520, attack: 44, attackSpeed: 0.9, range: 3, maxMana: 65,
    ability: { name: 'Chalice of Dawn', type: 'heal', power: 230,
      desc: 'Heals the most wounded ally for 230.' },
  },
  voidblade: {
    id: 'voidblade', name: 'Voidblade', cost: 2, tier: 2,
    glyph: '⚔', accent: '#f0abfc',
    maxHp: 560, attack: 78, attackSpeed: 1.25, range: 1, maxMana: 60,
    ability: { name: 'Eclipse Execute', type: 'execute', power: 180, bonus: 220,
      desc: 'Deals 180, or 400 to foes below 40% HP.' },
  },
  chrono: {
    id: 'chrono', name: 'Chrono Warden', cost: 3, tier: 3,
    glyph: '⧗', accent: '#a5f3fc',
    maxHp: 600, attack: 66, attackSpeed: 1.0, range: 2, maxMana: 80,
    ability: { name: 'Hourglass Fracture', type: 'slow', power: 200, duration: 3000, factor: 0.5,
      desc: 'Deals 200 and halves the target attack speed for 3s.' },
  },
  colossus: {
    id: 'colossus', name: 'Nebula Colossus', cost: 3, tier: 3,
    glyph: '⬢', accent: '#fbbf24',
    maxHp: 1050, attack: 70, attackSpeed: 0.7, range: 1, maxMana: 90,
    ability: { name: 'Gravitic Aegis', type: 'shield', power: 340, splash: 120,
      desc: 'Shields itself for 340 and nearby allies for 120.' },
  },
};

export const TEMPLATE_LIST = Object.values(UNIT_TEMPLATES);

/* ====================== RANK SYSTEM ====================== */

/** Ascending rank tiers. Index 0 is the starting rank. */
export const RANKS = ['F', 'D', 'C', 'B', 'A', 'S'];
export const MAX_RANK_INDEX = RANKS.length - 1;

/** Copies of one rank that combine into a single unit of the next rank. */
export const MERGE_COUNT = 3;

/**
 * Stat multiplier per rank (applied to maxHp AND attack).
 * Roughly 1.7× per step, so 3 F-rank copies (raw 3.0) become a D-rank
 * (raw 1.7) that also frees two bench slots — a compression win.
 */
export const RANK_STAT_MULT = [1, 1.7, 2.9, 4.9, 8.3, 14];

/**
 * Gold cost multiplier per rank. Matches the merge economy:
 * buying a D directly costs the same as buying 3 F's.
 */
export const RANK_COST_MULT = [1, 3, 9, 27, 81, 243];

/** Per-rank accent colours used by every rank badge in the UI. */
export const RANK_COLORS = [
  '#64748b', // F — slate-500
  '#94a3b8', // D — slate-400
  '#c4b5fd', // C — violet-300
  '#8ce8f7', // B — cyan-300
  '#f3d79b', // A — astral gold
  '#fde047', // S — bright gold
];

/**
 * Rolls a rank for a single shop offer based on progression.
 * Never returns above rank 3 (B) — the A/S tiers must be earned via merging.
 */
function rollRankForRound(round) {
  if (round <= 2) return 0;
  if (round <= 4) return Math.random() < 0.15 ? 1 : 0;
  if (round <= 6) return Math.random() < 0.25 ? 1 : Math.random() < 0.04 ? 2 : 0;
  if (round <= 9) return Math.random() < 0.30 ? 1 : Math.random() < 0.08 ? 2 : 0;
  return (
    Math.random() < 0.32 ? 1 :
    Math.random() < 0.15 ? 2 :
    Math.random() < 0.02 ? 3 : 0
  );
}

export function rollShopOffers(round, count = 5) {
  // Rarity weighting (tier 1/2/3 templates) — unchanged.
  const weight = (tier) => {
    if (tier === 1) return Math.max(7 - round * 0.6, 2);
    if (tier === 2) return 1.8 + round * 0.45;
    return Math.max(0.35 + (round - 2) * 0.4, 0.2);
  };
  const total = TEMPLATE_LIST.reduce((sum, t) => sum + weight(t.tier), 0);

  const offers = [];
  for (let i = 0; i < count; i++) {
    let roll = Math.random() * total;
    let picked = TEMPLATE_LIST[TEMPLATE_LIST.length - 1];
    for (const tpl of TEMPLATE_LIST) {
      roll -= weight(tpl.tier);
      if (roll <= 0) { picked = tpl; break; }
    }
    offers.push({ uid: uid('offer'), tplId: picked.id, rank: rollRankForRound(round) });
  }
  return offers;
}

/** Total gold a shop offer costs. */
export const offerCost = (offer) =>
  UNIT_TEMPLATES[offer.tplId].cost * RANK_COST_MULT[offer.rank ?? 0];