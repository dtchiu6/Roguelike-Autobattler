import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function Toast() {
  const toast = useGameStore((s) => s.ui.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(clearToast, 2200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="panel border-rose-300/40 bg-slate-950/90 px-6 py-2 font-display text-[11px] uppercase tracking-[0.3em] text-rose-200">
        {toast.msg}
      </div>
    </div>
  );
}