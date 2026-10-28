import { UNIT_TEMPLATES } from '../data/units';
import { RELIC_MAP } from '../data/relics';

const MOVE_COOLDOWN = 620;   // ms between grid steps
const FLOATER_LIFE = 850;    // ms a damage number lives
const RESOLVE_HOLD = 1000;   // ms victory/defeat banner before phase change

/** Chebyshev distance — diagonals count as 1 step. */
export const cheb = (a, b) =>
  Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));

/** Folds relic mods into a single modifier bag. */
function foldRelicMods(relicIds = []) {
  const mods = { hpMul: 1, atkMul: 1, asMul: 1, enemyAtkMul: 1, startMana: 0 };
  for (const id of relicIds) {
    const relic = RELIC_MAP[id];
    if (!relic?.mods) continue;
    for (const [key, value] of Object.entries(relic.mods)) {
      if (key === 'startMana') mods.startMana += value;
      else mods[key] *= value;
    }
  }
  return mods;
}

function buildUnit(src, team, mods) {
  const tpl = UNIT_TEMPLATES[src.tplId];
  const rank = src.rank ?? 0;
  const rankMul = RANK_STAT_MULT[rank];
  const isPlayer = team === 'player';

  const maxHp = Math.round(tpl.maxHp * rankMul * (isPlayer ? mods.hpMul : 1));
  const attackSpeed = tpl.attackSpeed * (isPlayer ? mods.asMul : 1);

  return {
    uid: src.uid,
    team,
    tplId: tpl.id,
    rank,                                          // ← carried into combat UI
    name: tpl.name,
    glyph: tpl.glyph,
    accent: tpl.accent,
    row: src.row,
    col: src.col,
    maxHp,
    hp: maxHp,
    attack: Math.round(tpl.attack * rankMul * (isPlayer ? mods.atkMul : mods.enemyAtkMul)),
    attackSpeed,
    range: tpl.range,
    maxMana: tpl.maxMana,
    mana: isPlayer ? Math.min(mods.startMana, tpl.maxMana) : 0,
    attackTimer: 1000 / attackSpeed,
    moveTimer: 0,
    shield: 0,
    slowUntil: 0,
    slowFactor: 1,
    alive: true,
    lastAttack: -9999,
    lastCast: -9999,
  };
}

/** Creates the immutable-ish combat snapshot stored in Zustand. */
export function createCombatState({ player, enemy, relics }) {
  const mods = foldRelicMods(relics);
  const units = [
    ...player.map((p) => buildUnit(p, 'player', mods)),
    ...enemy.map((e) => buildUnit(e, 'enemy', mods)),
  ];
  return {
    time: 0, status: 'running', result: null, endTime: 0,
    units, floaters: [], log: [], seq: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers — these MUTATE the immer draft they are given.    */
/* ------------------------------------------------------------------ */

const isOccupied = (c, row, col, exceptUid) =>
  c.units.some((o) => o.alive && o.uid !== exceptUid && o.row === row && o.col === col);

function pushLog(c, text, team) {
  c.log.push({ id: ++c.seq, text, team, t: c.time });
  if (c.log.length > 7) c.log.shift();
}

function pushFloater(c, unit, amount, kind) {
  c.floaters.push({
    id: ++c.seq,
    row: unit.row,
    col: unit.col,
    amount: Math.round(amount),
    kind,                 // hit | ability | heal | shield
    t: c.time,
  });
}

function dealDamage(c, target, rawAmount, kind) {
  if (!target.alive) return;
  let remaining = Math.max(1, Math.round(rawAmount));

  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp = Math.max(0, target.hp - remaining);
  target.mana = Math.min(target.maxMana, target.mana + 6); // taking damage builds mana
  pushFloater(c, target, Math.max(1, rawAmount), kind);

  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    pushLog(c, `${target.name} is unmade.`, target.team);
  }
}

function nearestEnemy(c, unit) {
  let best = null;
  let bestDist = Infinity;
  for (const other of c.units) {
    if (!other.alive || other.team === unit.team) continue;
    const d = cheb(unit, other);
    if (d < bestDist) { bestDist = d; best = other; }
  }
  return best;
}

function stepToward(c, unit, target) {
  const dr = Math.sign(target.row - unit.row);
  const dc = Math.sign(target.col - unit.col);

  // Move along the axis with the largest gap first, then fall back.
  const options = [];
  if (Math.abs(target.col - unit.col) >= Math.abs(target.row - unit.row)) {
    if (dc) options.push([0, dc]);
    if (dr) options.push([dr, 0]);
  } else {
    if (dr) options.push([dr, 0]);
    if (dc) options.push([0, dc]);
  }

  for (const [rr, cc] of options) {
    const nr = unit.row + rr;
    const nc = unit.col + cc;
    if (nr < 0 || nr > 3 || nc < 0 || nc > 8) continue;
    if (isOccupied(c, nr, nc, unit.uid)) continue;
    unit.row = nr;
    unit.col = nc;
    return;
  }
}

function basicAttack(c, unit, target) {
  dealDamage(c, target, unit.attack, 'hit');
  unit.mana = Math.min(unit.maxMana, unit.mana + 12);
  unit.lastAttack = c.time;
}

function castAbility(c, unit, target) {
  const ability = UNIT_TEMPLATES[unit.tplId].ability;
  unit.mana = 0;
  unit.lastCast = c.time;
  pushLog(c, `${unit.name} casts ${ability.name}.`, unit.team);

  switch (ability.type) {
    case 'single':
      dealDamage(c, target, ability.power, 'ability');
      break;

    case 'aoe': {
      const foes = c.units.filter(
        (o) => o.alive && o.team !== unit.team && cheb(o, target) <= ability.radius
      );
      for (const foe of foes) dealDamage(c, foe, ability.power, 'ability');
      if (ability.shield) {
        unit.shield += ability.shield;
        pushFloater(c, unit, ability.shield, 'shield');
      }
      break;
    }

    case 'heal': {
      const allies = c.units
        .filter((o) => o.alive && o.team === unit.team)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      const ally = allies[0] ?? unit;
      const healed = Math.min(ability.power, ally.maxHp - ally.hp);
      ally.hp += healed;
      pushFloater(c, ally, healed, 'heal');
      break;
    }

    case 'execute': {
      const isLow = target.hp / target.maxHp < 0.4;
      dealDamage(c, target, isLow ? ability.power + ability.bonus : ability.power, 'ability');
      break;
    }

    case 'slow':
      dealDamage(c, target, ability.power, 'ability');
      target.slowUntil = c.time + ability.duration;
      target.slowFactor = ability.factor;
      break;

    case 'shield': {
      unit.shield += ability.power;
      pushFloater(c, unit, ability.power, 'shield');
      if (ability.splash) {
        const allies = c.units.filter(
          (o) => o.alive && o.team === unit.team && o.uid !== unit.uid && cheb(o, unit) <= 2
        );
        for (const ally of allies) {
          ally.shield += ability.splash;
          pushFloater(c, ally, ability.splash, 'shield');
        }
      }
      break;
    }
    default:
      break;
  }
}

function evaluate(c) {
  const playerAlive = c.units.some((u) => u.team === 'player' && u.alive);
  const enemyAlive = c.units.some((u) => u.team === 'enemy' && u.alive);
  if (playerAlive && enemyAlive) return;

  c.status = enemyAlive ? 'defeat' : 'victory';
  c.result = c.status;
  c.endTime = c.time;
  pushLog(c, c.status === 'victory' ? 'The heavens fall silent — victory.' : 'Your light gutters out…',
    c.status === 'victory' ? 'player' : 'enemy');
}

/* ------------------------------------------------------------------ */
/*  PUBLIC TICK — called from Zustand inside an immer producer.        */
/* ------------------------------------------------------------------ */
export function simulateTick(c, dt) {
  if (c.status === 'resolved') return;

  c.time += dt;

  if (c.status === 'running') {
    // 1. Age out floating numbers
    if (c.floaters.length) {
      c.floaters = c.floaters.filter((f) => c.time - f.t < FLOATER_LIFE);
    }

    // 2. Every living unit acts, in stable array order (deterministic)
    for (const unit of c.units) {
      if (!unit.alive) continue;

      const target = nearestEnemy(c, unit);
      if (!target) break;

      // 2a. Ability takes priority over a basic attack
      if (unit.mana >= unit.maxMana) {
        castAbility(c, unit, target);
        continue; // casting consumes this tick
      }

      const distance = cheb(unit, target);
      const slowed = c.time < unit.slowUntil ? unit.slowFactor : 1;

      // 2b. Attack resolution
      unit.attackTimer -= dt;
      if (distance <= unit.range && unit.attackTimer <= 0) {
        basicAttack(c, unit, target);
        unit.attackTimer = 1000 / (unit.attackSpeed * slowed);
      } else if (unit.attackTimer < 0) {
        unit.attackTimer = 0; // clamped: never accumulate a burst of free attacks
      }

      // 2c. Close the gap when out of range
      if (distance > unit.range) {
        unit.moveTimer -= dt;
        if (unit.moveTimer <= 0) {
          stepToward(c, unit, target);
          unit.moveTimer = MOVE_COOLDOWN;
        }
      }
    }

    evaluate(c);
  } else if (c.time - c.endTime > RESOLVE_HOLD) {
    // Hold the result banner for a beat, then let the store transition phases.
    c.status = 'resolved';
  }
}