import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { UNIT_TEMPLATES, rollShopOffers } from '../data/units';
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
const makeInstance = (tplId) => ({ uid: uid('unit'), tplId, level: 1 });

/* ------------------------- location helpers ------------------------- */
// A "location" is { type:'bench', index } or { type:'board', r, c }

const readLoc = (s, loc) =>
  loc.type === 'bench' ? s.bench[loc.index] ?? null : s.board[loc.r][loc.c] ?? null;

const writeLoc = (s, loc, unit) => {
  if (loc.type === 'bench') s.bench[loc.index] = unit;
  else s.board[loc.r][loc.c] = unit;
};

const sameLoc = (a, b) => {
  if (!a || !b || a.type !== b.type) return false;
  return a.type === 'bench' ? a.index === b.index : a.r === b.r && a.c === b.c;
};

/** Moves or swaps a unit between two locations. */
const moveUnit = (s, from, to) => {
  if (sameLoc(from, to)) return;
  const a = readLoc(s, from);
  if (!a) return;
  const b = readLoc(s, to);
  writeLoc(s, from, b);
  writeLoc(s, to, a);
};

const toast = (s, msg) => {
  s.ui.toast = { id: uid('toast'), msg };
};

/* ----------------------------- the store ---------------------------- */
export const useGameStore = create(
  immer((set, get) => ({
    /* -------- run state -------- */
    phase: 'SHOP',            // SHOP | COMBAT | REWARD | MAP | GAMEOVER
    round: 1,
    gold: 12,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    encounter: 'standard',
    relics: [],
    lastResult: null,

    /* -------- board / inventory -------- */
    board: emptyBoard(),
    bench: emptyBench(),
    shop: { offers: rollShopOffers(1), locked: false },

    /* -------- encounter data -------- */
    enemyTeam: generateEnemyTeam(1, 'standard'),
    combat: null,

    /* -------- meta screens -------- */
    rewardChoices: [],
    mapNodes: [],

    /* -------- ui-only -------- */
    ui: { selected: null, toast: null, speed: 1 },

    /* =================== SHOP ACTIONS =================== */

    buyOffer(index) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const offer = s.shop.offers[index];
        if (!offer) return;

        const tpl = UNIT_TEMPLATES[offer.tplId];
        if (s.gold < tpl.cost) return toast(s, 'Not enough gold.');
        const slot = s.bench.findIndex((b) => b === null);
        if (slot === -1) return toast(s, 'Your bench is full.');

        s.gold -= tpl.cost;
        s.bench[slot] = makeInstance(offer.tplId);
        s.shop.offers[index] = null;
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
      set((s) => {
        s.shop.locked = !s.shop.locked;
      });
    },

    /** Right-click / hover-X sells a unit back for its cost. */
    sellAt(loc) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        const unit = readLoc(s, loc);
        if (!unit) return;
        s.gold += UNIT_TEMPLATES[unit.tplId].cost;
        writeLoc(s, loc, null);
        if (sameLoc(s.ui.selected, loc)) s.ui.selected = null;
      });
    },

    /* =================== SELECTION / PLACEMENT =================== */

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

    /** Drag & drop entry point — same swap logic as clicking. */
    dropAt(fromLoc, toLoc) {
      set((s) => {
        if (s.phase !== 'SHOP') return;
        if (toLoc.type === 'board' && !s.board[toLoc.r]?.[toLoc.c] &&
            s.board[toLoc.r]?.[toLoc.c] !== null) return; // out of bounds guard
        moveUnit(s, fromLoc, toLoc);
        s.ui.selected = null;
      });
    },

    clearSelection() {
      set((s) => {
        s.ui.selected = null;
      });
    },

    /* =================== COMBAT =================== */

    startCombat() {
      set((s) => {
        if (s.phase !== 'SHOP') return;

        const playerUnits = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const unit = s.board[r][c];
            if (unit) playerUnits.push({ uid: unit.uid, tplId: unit.tplId, row: r, col: c });
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

    /** Called by the rAF loop at a fixed timestep. */
    tickCombat(dt) {
      set((s) => {
        if (s.phase !== 'COMBAT' || !s.combat) return;
        simulateTick(s.combat, dt);
        if (s.combat.status === 'resolved') resolveCombat(s);
      });
    },

    setSpeed(speed) {
      set((s) => {
        s.ui.speed = speed;
      });
    },

    /* =================== REWARD / MAP =================== */

    chooseRelic(relicId) {
      set((s) => {
        if (relicId) s.relics.push(relicId);
        else s.gold += 3; // skip compensation
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
          s.shop.offers = rollShopOffers(s.round); // free reroll
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
      set((s) => {
        s.ui.toast = null;
      });
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

/* ------------------------------------------------------------------ */
/*  Post-combat resolution — runs inside the immer producer.           */
/* ------------------------------------------------------------------ */
function resolveCombat(s) {
  const combat = s.combat;
  const won = combat.result === 'victory';

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
    const survivors = combat.units.filter((u) => u.team === 'enemy' && u.alive).length;
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