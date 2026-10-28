export const NODE_TYPES = {
  standard: { type: 'standard', label: 'Astral Skirmish', glyph: '✦',
    desc: 'A standard engagement. Steady rewards.', tone: 'violet' },
  elite: { type: 'elite', label: 'Eclipse Elite', glyph: '✷',
    desc: 'A far deadlier foe. Far greater spoils.', tone: 'rose' },
  shop: { type: 'shop', label: 'Starlit Sanctum', glyph: '❖',
    desc: 'Gain 6 gold and a free shop reroll.', tone: 'cyan' },
};

/** Builds a 3-node branching choice, always containing at least one standard fight. */
export function makeMapNodes(round) {
  const types = ['standard'];
  if (Math.random() < 0.6) types.push('elite');
  if (Math.random() < 0.55) types.push('shop');
  while (types.length < 3) types.push(Math.random() < 0.3 ? 'elite' : 'standard');

  // Fisher-Yates shuffle so slot position is random
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types.map((type, i) => ({ ...NODE_TYPES[type], id: `n${round}_${i}` }));
}