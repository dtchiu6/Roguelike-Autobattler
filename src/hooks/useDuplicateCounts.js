import { useMemo } from 'react';

/** Returns a map of `"tplId:rank"` → count across both zones. */
export function useDuplicateCounts(bench, board) {
  return useMemo(() => {
    const counts = {};
    for (const unit of [...bench.filter(Boolean), ...board.flat().filter(Boolean)]) {
      if (!unit) continue;
      const key = `${unit.tplId}:${unit.rank ?? 0}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [bench, board]);
}