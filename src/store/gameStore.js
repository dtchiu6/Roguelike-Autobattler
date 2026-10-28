import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  UNIT_TEMPLATES, rollShopOffers, offerCost,
  RANKS, RANK_COST_MULT, MAX_RANK_INDEX, MERGE_COUNT,
} from '../data/units';
import { rollRelics } from '../data/relics';
import { generateEnemyTeam } from '../data/enemies';
import { makeMapNodes } from '../data/map';
import { createCombatState, simulateTick } from '../game/combat';
import { uid } from '../utils/id';

const BENCH_SIZE = 8;
const BOARD_SIZE = 4;
const REROLL_COST = 2;
const PLAYER_MAX_HP = 20;

const emptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
const emptyBench = () => Array(BENCH_SIZE).fill(null);

/** Unit instance — `rank` defaults to 0 (F tier). */
const makeInstance = (tplId, rank = 0) => ({ uid: uid('unit'), tplId, rank });

/* ------------------------- location helpers ------------------------- */

const readLoc = (s, loc) =>
  loc.type === 'bench' ? s.bench[loc.index] ?? null : s.board[loc.r][loc.c] ?? null;

const writeLoc = (s, loc, unit) => {
  if (loc.type === 'bench') s.bench[loc.index] = unit;
  else s.board[loc.r][loc.c] = unit;
};

const removeAt = (s, loc) => writeLoc(s, loc, null);

const sameLoc = (a, b) => {
  if (!a || !b || a.type !== b.type) return false;
  return a.type === 'bench' ? a.index === b.index : a.r === b.r && a.c === b.c;
};

const moveUnit = (s, from, to) => {
  if (sameLoc(from, to)) return;
  const a = readLoc(s, from);
  if (!a) return;
  const b = readLoc(s, to);
  writeLoc(s, from, b);
  writeLoc(s, to, a);
};

const toast = (s, msg, tone = 'error') => {
  s.ui.toast = { id: uid('toast'), msg, tone };
};

/** Returns every { unit, loc } pair across bench + board. */
const collectAllUnits = (s) => {
  const out = [];
  for (let i = 0; i < s.bench.length; i++) {
    if (s.bench[i]) out.push({ unit: s.bench[i], loc: { type: 'bench', index: i } });
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (s.board[r][c]) out.push({ unit: s.board[r][c], loc: { type: 'board', r, c } });
    }
  }
  return out;
};

const findBenchSlot = (s) => s.bench.findIndex((b) => b === null);

/** First empty deployable cell (player side = columns 0..3). */
const findEmptyBoardSlot = (s) => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c <= 3; c++) {
      if (!s.board[r][c]) return { r, c };
    }
  }
  return null;
};

/**
 * Merges any group of MERGE_COUNT identical (tplId, rank) copies into one
 * unit of rank+1. Runs repeatedly so a fresh rank-up can cascade into
 * another merge. Prefers keeping an on-board keeper so deployed units
 * remain deployed.
 */
const runMergePass = (s) => {
  let safety = 20; // hard ceiling to prevent runaway cascade
  while (safety-- > 0) {
    const groups = {};
    for (const entry of collectAllUnits(s)) {
      if (entry.unit.rank >= MAX_RANK_INDEX) continue; // S can't merge up
      const key = `${entry.unit.tplId}:${entry.unit.rank}`;
      (groups[key] ??= []).push(entry);
    }

    let didMerge = false;
    for (const group of Object.values(groups)) {
      if (group.length < MERGE_COUNT) continue;

      // On-board entries first so the keeper stays deployed.
      group.sort((a, b) =>
        (a.loc.type === 'board' ? 0 : 1) - (b.loc.type === 'board' ? 0 : 1)
      );

      const keeper = group[0];
      const consumed = group.slice(1, MERGE_COUNT);

      for (const entry of consumed) removeAt(s, entry.loc);
      keeper.unit.rank += 1;

      const tpl = UNIT_TEMPLATES[keeper.unit.tplId];
      toast(s, `✦ ${tpl.name} ascended to ${RANKS[keeper.unit.rank]}-Rank`, 'success');

      didMerge = true;
      break; // restart to catch the newly-created group
    }
    if (!didMerge) break;
  }
};

/* ----------------------------- the store ---------------------------- */

export const useGameStore = create(
  immer((set) => ({
    phase: 'SHOP',
    round: 1,
    gold: 12,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    encounter: 'standard',
    relics: [],
    lastResult: null,

    board: emptyBoard(),
    bench: emptyBench(),
    shop: { offers: rollShopOffers(1), locked: false },

    enemyTeam: generateEnemyTeam(1, 'standard'),
    combat: null,

    rewardChoices: [],
    mapNodes: [],

    ui: { selected: null, toast: null, speed: 1 },

    /* =================== SHOP ACTIONS =================== */

    buyOffer(index) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const offer = s.shop.offers[index];
        if (!offer) return;

        const cost = offerCost(offer);
        if (s.gold < cost) return toast(s, 'Not enough gold.');

        const rank = offer.rank ?? 0;
        const newInstance = makeInstance(offer.tplId, rank);

        const benchSlot = findBenchSlot(s);

        if (benchSlot !== -1) {
          // Fast path: bench has room, just add + merge.
          s.bench[benchSlot] = newInstance;
          runMergePass(s);
        } else {
          // Bench is full. Try a direct merge against 2 existing copies.
          const matches = collectAllUnits(s).filter(
            (e) => e.unit.tplId === offer.tplId && e.unit.rank === rank
          );

          if (matches.length >= 2 && rank < MAX_RANK_INDEX) {
            matches.sort((a, b) =>
              (a.loc.type === 'board' ? 0 : 1) - (b.loc.type === 'board' ? 0 : 1)
            );
            const keeper = matches[0];
            const consumed = matches[1];

            removeAt(s, consumed.loc);
            keeper.unit.rank += 1;

            const tpl = UNIT_TEMPLATES[keeper.unit.tplId];
            toast(s, `✦ ${tpl.name} ascended to ${RANKS[keeper.unit.rank]}-Rank`, 'success');

            runMergePass(s); // cascades
          } else {
            // Last resort: auto-place on an empty board cell.
            const boardSlot = findEmptyBoardSlot(s);
            if (!boardSlot) return toast(s, 'No space to summon.');

            s.board[boardSlot.r][boardSlot.c] = newInstance;
            runMergePass(s);
          }
        }

        s.gold -= cost;
        s.shop.offers[index] = null;
        s.ui.selected = null;
      });
    },

    rerollShop() {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        if (s.gold < REROLL_COST) return toast(s, 'Not enough gold to reroll.');
        s.gold -= REROLL_COST;
        s.shop.offers = rollShopOffers(s.round);
        s.ui.selected = null;
      });
    },

    toggleLock() {
      set((s) => { s.shop.locked = !s.shop.locked; });
    },

    /** Sell refund scales with rank — refunds exactly the invested value. */
    sellAt(loc) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const unit = readLoc(s, loc);
        if (!unit) return;
        const tpl = UNIT_TEMPLATES[unit.tplId];
        s.gold += tpl.cost * RANK_COST_MULT[unit.rank ?? 0];
        removeAt(s, loc);
        if (sameLoc(s.ui.selected, loc)) s.ui.selected = null;
      });
    },

    /* =================== SELECTION =================== */

    clickBenchSlot(index) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const sel = s.ui.selected;
        if (sel) {
          moveUnit(s, sel, { type: 'bench', index });
          s.ui.selected = null;
        } else if (s.bench[index]) {
          s.ui.selected = { type: 'bench', index };
        }
      });
    },

    clickBoardCell(r, c) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const sel = s.ui.selected;
        if (sel) {
          moveUnit(s, sel, { type: 'board', r, c });
          s.ui.selected = null;
        } else if (s.board[r][c]) {
          s.ui.selected = { type: 'board', r, c };
        }
      });
    },

    dropAt(fromLoc, toLoc) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        moveUnit(s, fromLoc, toLoc);
        s.ui.selected = null;
      });
    },

    clearSelection() {
      set((s) => { s.ui.selected = null; });
    },

    /* =================== COMBAT =================== */

    startCombat() {
      set((s) => {
        if (s.phase !== 'SHOP') return;

        const playerUnits = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const unit = s.board[r][c];
            if (unit) {
              playerUnits.push({
                uid: unit.uid,
                tplId: unit.tplId,
                row: r,
                col: c,
                rank: unit.rank ?? 0,
              });
            }
          }
        }
        if (!playerUnits.length) return toast(s, 'Deploy at least one unit to fight.');

        s.combat = createCombatState({
          player: playerUnits,
          enemy: s.enemyTeam,
          relics: s.relics,
        });
        s.phase = 'COMBAT';
        s.ui.selected = null;
      });
    },

    tickCombat(dt) {
      set((s) => {
        if (s.phase !== 'COMBAT' || !s.combat) return;
        simulateTick(s.combat, dt);
        if (s.combat.status === 'resolved') resolveCombat(s);
      });
    },

    setSpeed(speed) {
      set((s) => { s.ui.speed = speed; });
    },

    /* =================== REWARD / MAP =================== */

    chooseRelic(relicId) {
      set((s) => {
        if (relicId) s.relics.push(relicId);
        else s.gold += 3;
        s.rewardChoices = [];
        s.mapNodes = makeMapNodes(s.round);
        s.phase = 'MAP';
        s.combat = null;
      });
    },

    chooseNode(nodeId) {
      set((s) => {
        const node = s.mapNodes.find((n) => n.id === nodeId);
        if (!node) return;

        s.round += 1;
        s.encounter = node.type === 'elite' ? 'elite' : 'standard';

        if (node.type === 'shop') {
          s.gold += 6;
          s.shop.offers = rollShopOffers(s.round);
          s.shop.locked = false;
        } else if (!s.shop.locked) {
          s.shop.offers = rollShopOffers(s.round);
        }

        s.enemyTeam = generateEnemyTeam(s.round, s.encounter);
        s.combat = null;
        s.mapNodes = [];
        s.phase = 'SHOP';
      });
    },

    /* =================== MISC =================== */

    clearToast() {
      set((s) => { s.ui.toast = null; });
    },

    restart() {
      set((s) => {
        s.phase = 'SHOP';
        s.round = 1;
        s.gold = 12;
        s.hp = PLAYER_MAX_HP;
        s.maxHp = PLAYER_MAX_HP;
        s.encounter = 'standard';
        s.relics = [];
        s.lastResult = null;
        s.board = emptyBoard();
        s.bench = emptyBench();
        s.shop = { offers: rollShopOffers(1), locked: false };
        s.enemyTeam = generateEnemyTeam(1, 'standard');
        s.combat = null;
        s.rewardChoices = [];
        s.mapNodes = [];
        s.ui = { selected: null, toast: null, speed: 1 };
      });
    },
  }))
);

function resolveCombat(s) {
  const won = s.combat.result === 'victory';
  if (won) {
    const goldGain =
      4 + s.round +
      (s.encounter === 'elite' ? 3 : 0) +
      (s.relics.includes('sovereign_ledger') ? 2 : 0);
    s.gold += goldGain;
    s.lastResult = { won: true, gold: goldGain };
    s.rewardChoices = rollRelics(3, s.relics);
    s.phase = 'REWARD';
  } else {
    const survivors = s.combat.units.filter((u) => u.team === 'enemy' && u.alive).length;
    const damage = 3 + survivors * 2 + Math.floor(s.round / 2);
    s.hp = Math.max(0, s.hp - damage);
    s.lastResult = { won: false, damage };
    if (s.hp <= 0) {
      s.phase = 'GAMEOVER';
    } else {
      s.mapNodes = makeMapNodes(s.round);
      s.phase = 'MAP';
      s.combat = null;
    }
  }
}