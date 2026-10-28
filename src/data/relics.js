/**
 * Relics are permanent run-wide passives. `mods` are consumed by the combat
 * engine when a battle is instantiated:
 *   hpMul / atkMul / asMul / enemyAtkMul -> multiplicative
 *   startMana                            -> additive
 */
export const RELICS = [
  { id: 'aegis_dawn', name: 'Aegis of Dawn', glyph: '❖',
    desc: '+18% max HP for all your units.', mods: { hpMul: 1.18 } },
  { id: 'edge_eternity', name: 'Edge of Eternity', glyph: '⚔',
    desc: '+22% attack damage for your units.', mods: { atkMul: 1.22 } },
  { id: 'chalice_stars', name: 'Chalice of Stars', glyph: '❉',
    desc: 'Your units begin combat with 30 mana.', mods: { startMana: 30 } },
  { id: 'tempo_spheres', name: 'Tempo of the Spheres', glyph: '⧗',
    desc: '+20% attack speed.', mods: { asMul: 1.2 } },
  { id: 'voidward_sigil', name: 'Voidward Sigil', glyph: '✦',
    desc: 'Enemies deal 12% less damage.', mods: { enemyAtkMul: 0.88 } },
  { id: 'sovereign_ledger', name: "Sovereign's Ledger", glyph: '◈',
    desc: 'Gain +2 gold after each victory.', mods: {} },
  { id: 'astral_prism', name: 'Astral Prism', glyph: '✷',
    desc: '+10% max HP and +10% attack.', mods: { hpMul: 1.1, atkMul: 1.1 } },
];

export const RELIC_MAP = Object.fromEntries(RELICS.map((r) => [r.id, r]));

/** Returns `count` distinct relic ids not already owned. */
export function rollRelics(count, owned = []) {
  const pool = RELICS.filter((r) => !owned.includes(r.id)).map((r) => r.id);
  const out = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}