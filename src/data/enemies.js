import { TEMPLATE_LIST, MAX_RANK_INDEX } from './units';
import { uid } from '../utils/id';

const ENEMY_ROWS = [1, 2, 0, 3];

/**
 * Enemy ranks now drive the difficulty curve (replacing the old flat
 * statMul). Base rank climbs one step every 3 rounds; elites sit one tier
 * higher; individual units vary ±1 rank for flavour.
 */
export function generateEnemyTeam(round, encounter = 'standard') {
  const elite = encounter === 'elite';
  const count = Math.min(2 + Math.floor((round + 1) / 2) + (elite ? 1 : 0), 6);

  const baseRank = Math.min(
    MAX_RANK_INDEX,
    Math.floor((round - 1) / 3) + (elite ? 1 : 0)
  );

  const team = [];
  for (let i = 0; i < count; i++) {
    const tpl = TEMPLATE_LIST[Math.floor(Math.random() * TEMPLATE_LIST.length)];

    let rank = baseRank;
    const r = Math.random();
    if (r < 0.15) rank += 1;
    else if (r < 0.35) rank -= 1;
    rank = Math.max(0, Math.min(MAX_RANK_INDEX, rank));

    team.push({
      uid: uid('e'),
      tplId: tpl.id,
      row: ENEMY_ROWS[i % 4],
      col: 5 + Math.floor(i / 4),
      rank,
    });
  }
  return team;
}