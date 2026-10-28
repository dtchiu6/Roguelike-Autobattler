import { useGameStore } from './store/gameStore';
import { useCombatLoop } from './hooks/useCombatLoop';

import Starfield from './components/Starfield';
import TopHUD from './components/TopHUD';
import Arena from './components/Arena';
import Bench from './components/Bench';
import ShopPanel from './components/ShopPanel';
import CombatBar from './components/CombatBar';
import RewardScreen from './components/RewardScreen';
import MapScreen from './components/MapScreen';
import GameOver from './components/GameOver';
import Toast from './components/Toast';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  // The single rAF driver for the autonomous battle phase.
  useCombatLoop();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Starfield />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col px-5 py-4">
        <TopHUD />

        {(phase === 'SHOP' || phase === 'COMBAT') && (
          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_330px] gap-4">
            {/* LEFT: battlefield */}
            <div className="flex flex-col">
              <Arena />
              <Bench />
              <CombatBar />
            </div>

            {/* RIGHT: summon interface (frozen during combat) */}
            <div className={phase === 'COMBAT' ? 'pointer-events-none opacity-40 transition-opacity duration-500' : 'transition-opacity duration-500'}>
              <ShopPanel />
            </div>
          </div>
        )}

        {phase === 'REWARD' && <RewardScreen />}
        {phase === 'MAP' && <MapScreen />}
        {phase === 'GAMEOVER' && <GameOver />}
      </div>

      <Toast />
    </div>
  );
}