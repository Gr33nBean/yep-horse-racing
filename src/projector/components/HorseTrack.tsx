import { useEffect, useState, useRef, memo } from "react";
import { GamePhase, type GameState } from "../../common/types";
import confetti from "canvas-confetti";

interface HorseTrackProps {
  gameState: GameState;
}

export function HorseTrack({ gameState }: HorseTrackProps) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [finished, setFinished] = useState(false);
  const confettiTriggered = useRef(false);

  // Confetti effect
  useEffect(() => {
    if (gameState.phase === GamePhase.RESULT && !confettiTriggered.current) {
      confettiTriggered.current = true;
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF4500"],
      });
    }

    if (gameState.phase === GamePhase.WAITING) {
      confettiTriggered.current = false;
    }
  }, [gameState.phase]);

  // Sync State
  useEffect(() => {
    if (
      gameState.phase !== GamePhase.RACING &&
      gameState.phase !== GamePhase.RESULT
    ) {
      setProgress(0);
      setSpeed(0);
      setFinished(false);
      return;
    }

    if (gameState.phase === GamePhase.RESULT) {
      setFinished(true);
      setProgress(100);
      return;
    }

    if (gameState.progress !== undefined) setProgress(gameState.progress);
    if (gameState.speed !== undefined) setSpeed(gameState.speed);
    if (gameState.connectedDevices !== undefined)
      setConnectedDevices(gameState.connectedDevices);
  }, [gameState]);

  return (
    <div className="size-full relative flex flex-col justify-center bg-gradient-to-b from-sky-400 to-green-600 overflow-hidden p-8 rounded-xl border-4 border-yellow-600">
      <TrackVisuals speed={speed} />

      <RaceMetrics speed={speed} connectedDevices={connectedDevices} />

      <RaceProgress progress={progress} />

      {finished && <WinnerOverlay winners={gameState.winners || []} />}

      <TrackStyles />
    </div>
  );
}

// --- Sub-Components ---

const TrackVisuals = memo(({ speed }: { speed: number }) => (
  <>
    {/* Ground/Track */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-900 to-amber-700" />

    {/* Horse Animation */}
    <div className="flex-1 flex items-center justify-center relative z-10">
      <div
        className="text-9xl transition-all duration-300 drop-shadow-2xl filter"
        style={{
          animation:
            speed > 5
              ? `gallop ${Math.max(0.15, 0.6 - speed / 150)}s cubic-bezier(0.36, 0, 0.66, -0.56) infinite`
              : "breathe 3s ease-in-out infinite",
          transform: `scale(${1 + speed / 300})`,
        }}
      >
        🐎
      </div>
    </div>
  </>
));

const RaceMetrics = memo(
  ({
    speed,
    connectedDevices,
  }: {
    speed: number;
    connectedDevices: number;
  }) => (
    <div className="absolute bottom-20 left-8 right-8 z-20 flex justify-between text-white text-xl font-bold drop-shadow-lg font-mono">
      <div className="bg-black/40 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-3">
        <span className="text-3xl">🚀</span>
        <div>
          <div className="text-xs text-gray-300 uppercase tracking-wider">
            Speed
          </div>
          <div className="text-yellow-400">{Math.round(speed)} km/h</div>
        </div>
      </div>
      <div className="bg-black/40 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-3">
        <span className="text-3xl">👥</span>
        <div>
          <div className="text-xs text-gray-300 uppercase tracking-wider">
            Racers
          </div>
          <div className="text-sky-400">{connectedDevices}</div>
        </div>
      </div>
    </div>
  ),
);

const RaceProgress = memo(({ progress }: { progress: number }) => (
  <div className="absolute bottom-8 left-8 right-8 z-30">
    <div className="flex justify-between text-white text-xs font-bold mb-1 uppercase tracking-widest drop-shadow-md px-1">
      <span>Start</span>
      <span>Finish</span>
    </div>
    <div className="bg-black/50 rounded-full h-8 overflow-hidden border-2 border-white/30 backdrop-blur-sm shadow-inner relative">
      {/* Track marks */}
      <div className="absolute inset-0 flex justify-between px-2 opacity-30">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-0.5 h-full bg-white/50" />
        ))}
      </div>

      <div
        className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 h-full transition-all duration-300 relative"
        style={{ width: `${progress}%` }}
      >
        {/* Glare effect */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20" />
        {/* Head indicator */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white]" />
      </div>
    </div>
  </div>
));

const WinnerOverlay = memo(({ winners }: { winners: (string | number)[] }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
    <div className="text-center p-12 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-3xl shadow-2xl border-8 border-yellow-200 transform scale-110 animate-bounce-slow">
      <h2 className="text-6xl font-black text-white drop-shadow-2xl mb-6 uppercase tracking-wider">
        🏆 Winner 🏆
      </h2>
      {winners.length > 0 ? (
        <div className="flex flex-col gap-4 justify-center items-center">
          {winners.map((w) => (
            <div
              key={w}
              className="bg-white text-black font-bold font-mono text-5xl px-12 py-6 rounded-full shadow-2xl border-4 border-yellow-400 animate-pulse"
            >
              Lucky #{w}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-3xl text-white">Race Finished!</p>
      )}
    </div>
  </div>
));

const TrackStyles = () => (
  <style>{`
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes gallop {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-15px) rotate(2deg); }
    }
    .animate-bounce-slow { animation: bounce 2s ease-in-out infinite; }
    @keyframes bounce {
      0%, 100% { transform: scale(1.1); }
      50% { transform: scale(1.15); }
    }
  `}</style>
);
