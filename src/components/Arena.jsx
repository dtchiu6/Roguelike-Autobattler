import { UNIT_TEMPLATES } from '../data/units';
import { useGameStore } from '../store/gameStore';
import { useDuplicateCounts } from '../hooks/useDuplicateCounts';
import UnitToken from './UnitToken';

const COLS = 9;
const ROWS = 4;
const DEPLOY_MAX_COL = 3;   // player deploy zone = columns 0..3
const RIFT_COL = 4;         // neutral middle column

export default function Arena() {
  const phase = useGameStore((s) => s.phase);
  const board = useGameStore((s) => s.board);
  const bench = useGameStore((s) => s.bench);
  const enemyTeam = useGameStore((s) => s.enemyTeam);
  const combat = useGameStore((s) => s.combat);
  const selected = useGameStore((s) => s.ui.selected);

  const clickBoardCell = useGameStore((s) => s.clickBoardCell);
  const dropAt = useGameStore((s) => s.dropAt);

  // Duplicate counts across bench + board, keyed by "tplId:rank".
  // Used to surface "2/3" merge-progress badges during the shop phase.
  const duplicates = useDuplicateCounts(bench, board);

  const inCombat = phase === 'COMBAT';
  const canEdit = phase === 'SHOP';

  /* ---- Build the token list for whichever mode we're in ---- */
  const tokens = inCombat && combat
    ? combat.units
    : [
        ...board
          .flatMap((row, r) =>
            row.map((unit, c) => (unit ? { ...unit, row: r, col: c, team: 'player' } : null))
          )
          .filter(Boolean),
        ...enemyTeam.map((e) => ({ ...e, team: 'enemy' })),
      ];

  /* ---- Drag payload helpers ---- */
  const handleDragStart = (e, loc) => {
    e.dataTransfer.setData('application/astral-loc', JSON.stringify(loc));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, loc) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/astral-loc');
    if (!raw) return;
    try {
      dropAt(JSON.parse(raw), loc);
    } catch {
      /* ignore malformed payloads */
    }
  };

  /* ---- Pre-compute static grid cells once ---- */
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells.push({ r, c });
  }

  return (
    <div className="relative">
      {/* Arena frame */}
      <div
        className="panel panel-cut relative w-full overflow-hidden p-2 shadow-inner-astral"
        style={{ aspectRatio: '9 / 4', minHeight: 300 }}
      >
        {/* Grid cells */}
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0,1fr))`,
          }}
        >
          {cells.map(({ r, c }) => {
            const isDeploy = c <= DEPLOY_MAX_COL;
            const isRift = c === RIFT_COL;
            const isTargetable = canEdit && isDeploy;
            const loc = { type: 'board', r, c };

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => isTargetable && clickBoardCell(r, c)}
                onDragOver={(e) => {
                  if (!isTargetable) return;
                  e.preventDefault();
                  e.currentTarget.dataset.hover = 'true';
                }}
                onDragLeave={(e) => {
                  delete e.currentTarget.dataset.hover;
                }}
                onDrop={(e) => isTargetable && handleDrop(e, loc)}
                className={[
                  'relative border transition-all duration-300 ease-out',
                  isRift
                    ? 'border-cyan-400/10 bg-gradient-to-b from-transparent via-cyan-400/[0.07] to-transparent'
                    : isDeploy
                      ? 'border-purple-400/15 bg-purple-500/[0.035]'
                      : 'border-rose-400/[0.08] bg-rose-500/[0.03]',
                  isTargetable &&
                    'cursor-pointer hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:shadow-glow-cyan',
                  isTargetable && selected && 'border-cyan-300/25',
                ].join(' ')}
                data-hover-target={isTargetable ? 'true' : undefined}
              />
            );
          })}
        </div>

        {/* Rift shimmer — decorative vertical band at the dividing column */}
        <div
          className="pointer-events-none absolute inset-y-0 animate-pulse-slow"
          style={{
            left: `${(RIFT_COL / COLS) * 100}%`,
            width: `${(1 / COLS) * 100}%`,
          }}
        >
          <div className="h-full w-full bg-gradient-to-b from-cyan-300/0 via-cyan-300/[0.09] to-cyan-300/0" />
        </div>

        {/* Units */}
        {tokens.map((unit) => (
          <UnitToken
            key={unit.uid}
            unit={unit}
            combatTime={inCombat ? combat?.time : undefined}
            preview={!inCombat && unit.team === 'enemy'}
            duplicateCount={
              canEdit && unit.team !== 'enemy'
                ? duplicates[`${unit.tplId}:${unit.rank ?? 0}`] ?? 1
                : undefined
            }
            onDragStart={
              canEdit && unit.team !== 'enemy'
                ? (e) =>
                    handleDragStart(e, {
                      type: 'board',
                      r: unit.row,
                      c: unit.col,
                    })
                : undefined
            }
            onClick={
              canEdit && unit.team !== 'enemy'
                ? () => clickBoardCell(unit.row, unit.col)
                : undefined
            }
          />
        ))}

        {/* Floating damage numbers */}
        {inCombat &&
          combat?.floaters.map((f) => {
            const isHeal = f.kind === 'heal';
            const isShield = f.kind === 'shield';
            const isAbility = f.kind === 'ability';
            return (
              <div
                key={f.id}
                className="pointer-events-none absolute z-30 animate-float-up font-display text-sm font-semibold"
                style={{
                  left: `${((f.col + 0.5) / COLS) * 100}%`,
                  top: `${((f.row + 0.5) / ROWS) * 100}%`,
                  color: isHeal
                    ? '#86efac'
                    : isShield
                      ? '#8ce8f7'
                      : isAbility
                        ? '#f3d79b'
                        : '#fda4af',
                  textShadow:
                    '0 0 10px currentColor, 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {isHeal ? '+' : isShield ? '⛨' : ''}
                {f.amount}
              </div>
            );
          })}

        {/* Zone labels */}
        <div className="pointer-events-none absolute bottom-1 left-3 font-display text-[9px] uppercase tracking-[0.3em] text-purple-300/30">
          Deploy
        </div>
        <div className="pointer-events-none absolute right-3 top-1 font-display text-[9px] uppercase tracking-[0.3em] text-rose-300/30">
          Hostile
        </div>
      </div>
    </div>
  );
}