import { useEffect, useState } from "react";
import { GamePhase, type GameState } from "../../common/types";

interface Props {
  gameState: GameState;
}

export function CountdownOverlay({ gameState }: Props) {
  const [localCountdown, setLocalCountdown] = useState(3);

  useEffect(() => {
    if (gameState.phase === GamePhase.COUNTDOWN && gameState.startTime) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((gameState.startTime! - Date.now()) / 1000);
        setLocalCountdown(Math.max(0, remaining));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState.phase, gameState.startTime]);

  if (gameState.phase !== GamePhase.COUNTDOWN) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-8 animate-pulse">
        Race Starting In
      </h1>
      <div className="text-[15rem] leading-none font-black text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] scale-110 animate-bounce">
        {localCountdown}
      </div>
      <p className="text-2xl text-gray-400 font-mono mt-8">GET READY!</p>
    </div>
  );
}
