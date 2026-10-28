import { TEMPLATE_LIST } from './units';
import { uid } from '../utils/id';

const ENEMY_ROWS = [1, 2, 0, 3];

/**
 * Generates the opposing warband for a round.
 * Enemy arena columns start at 5 (player deploys in 0..3, column 4 is the rift).
 */
export function generateEnemyTeam(round, encounter = 'standard') {
  const elite = encounter === 'elite';
  const count = Math.min(2 + Math.floor((round + 1) / 2) + (elite ? 1 : 0), 6);
  const statMul = 1 + (round - 1) * 0.16 + (elite ? 0.4 : 0);

  const team = [];
  for (let i = 0; i < count; i++) {
    const tpl = TEMPLATE_LIST[Math.floor(Math.random() * TEMPLATE_LIST.length)];
    team.push({
      uid: uid('e'),
      tplId: tpl.id,
      row: ENEMY_ROWS[i % 4],
      col: 5 + Math.floor(i / 4),
      statMul,
    });
  }
  return team;
}