import { useEffect, useState, useRef, memo } from "react";
import { GamePhase, type GameState } from "../../common/types";
import confetti from "canvas-confetti";
import { FireIcon } from "../../assets/icons";

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
    <div
      className="size-full relative flex flex-col justify-center overflow-hidden p-8 rounded-xl border-4 border-yellow-600"
      style={{
        backgroundImage: "url('/images/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <TrackVisuals speed={speed} selectedHorseId={gameState.selectedHorseId} />

      <RaceMetrics speed={speed} connectedDevices={connectedDevices} />

      <RaceProgress progress={progress} />

      {finished && <WinnerOverlay winners={gameState.winners || []} />}

      <TrackStyles />
    </div>
  );
}

// --- Sub-Components ---

const TrackVisuals = memo(
  ({ speed, selectedHorseId }: { speed: number; selectedHorseId?: string }) => (
    <>
      {/* Ground/Track */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/race.png')",
          backgroundSize: "cover",
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/shadow-t.png')",
          backgroundSize: "cover",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute left-0 top-0 w-[20%] aspect-[200/110]"
        style={{
          backgroundImage: "url('/images/left.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute right-0 top-0 w-[18%] aspect-[200/110]"
        style={{
          backgroundImage: "url('/images/right.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute left-1/2 -translate-x-1/2 top-[6.5%] w-[30%] aspect-[300/48]"
        style={{
          backgroundImage: "url('/images/logo.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Horse Animation */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[20.78%] aspect-square h-[43.75%] z-10">
        <HorseSprite speed={speed} selectedHorseId={selectedHorseId} />
      </div>

      {/* Fire Particles */}
      <FireParticles speed={speed} />
    </>
  ),
);

const FireParticles = memo(({ speed }: { speed: number }) => {
  const particles = useRef(
    [...Array(50)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${40 + Math.random() * 60}%`,
      delay: `-${Math.random() * 8}s`,
      scale: 0.5 + Math.random() * 1.5,
      duration: 3 + Math.random() * 4, // Slower, more graceful
      blur: Math.random() * 2, // Depth of field effect
      xDrift: (Math.random() - 0.5) * 50, // Slight horizontal drift
    })),
  ).current;

  // Global intensity
  const intensity = Math.min(1, Math.max(0, (speed - 5) / 60));

  if (speed < 5) return null;

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
      style={{
        opacity: intensity,
        transition: "opacity 0.5s",
        mixBlendMode: "screen", // clearer fire look
      }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-fire-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: `${Math.max(1, p.duration / (speed / 40 + 0.5))}s`,
            filter: `blur(${p.blur}px) drop-shadow(0 0 ${p.scale * 4}px #FF5500)`,
            // We use a CSS var for drift if we wanted dynamic, but keyframes are easier if generic
            // For unique drift, we can set custom property or just rely on generic wobble
            transform: `scale(${p.scale})`,
          }}
        >
          <FireIcon
            width={`${p.scale * 2 + 1}vh`}
            height={`${p.scale * 2 + 1}vh`}
          />
        </div>
      ))}
    </div>
  );
});

const HorseSprite = ({
  speed,
  selectedHorseId = "1",
}: {
  speed: number;
  selectedHorseId?: string;
}) => {
  const [frame, setFrame] = useState(0); // 0 to 4
  const lastFrameTime = useRef(0);

  useEffect(() => {
    let rAF_ID: number;

    const animate = (time: number) => {
      // Idle if speed is 0
      if (speed <= 0.1) {
        setFrame(0);
        rAF_ID = requestAnimationFrame(animate);
        return;
      }

      // Calculate delay based on speed
      // Speed 100 => 30ms delay
      // Speed 1 => 200ms delay
      const delay = Math.max(30, 200 - speed * 1.7);

      if (time - lastFrameTime.current > delay) {
        setFrame((prev) => (prev + 1) % 5); // Cycle 0-4
        lastFrameTime.current = time;
      }

      rAF_ID = requestAnimationFrame(animate);
    };

    rAF_ID = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rAF_ID);
  }, [speed]);

  return (
    <div
      className="h-full aspect-square transition-transform duration-300"
      style={{
        backgroundImage: `url('/images/run/${selectedHorseId}.png')`,
        backgroundSize: "500% 100%", // 5 frames wide
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${frame * 25}% center`, // 0%, 25%, 50%, 75%, 100%
        transform: `scale(${1 + speed / 400})`,
      }}
    />
  );
};

const RaceMetrics = memo(
  ({
    speed,
    connectedDevices,
  }: {
    speed: number;
    connectedDevices: number;
  }) => (
    <div className="absolute bottom-[2.5%] left-1/2 -translate-x-1/2 z-20 flex justify-center items-center gap-[2vw]">
      <div className="bg-black/20 px-[1vw] py-[0.5vh] rounded-full flex items-center gap-2 text-[2.2vh]">
        <div className="h-[2.5vh] flex items-center gap-1">
          <div className="h-full aspect-square">
            <FireIcon width={"100%"} height={"100%"} />
          </div>
          <span>/sec</span>
        </div>
        <div className="text-white font-bold">{Math.round(speed)}</div>
      </div>

      <div className="bg-black/20 px-[1vw] py-[0.5vh] rounded-full flex items-center gap-2 text-[2.2vh]">
        <div className="h-[2.5vh] flex items-center gap-1">
          <span>Total</span>
        </div>
        <div className="text-white font-bold">{connectedDevices}</div>
      </div>
    </div>
  ),
);

const RaceProgress = memo(({ progress }: { progress: number }) => (
  <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[76%] z-30">
    <div className="flex justify-center text-white text-[2vh] font-bold mb-[2vh] uppercase tracking-widest items-center drop-shadow-md px-1 gap-[0.5vw]">
      <FireIcon width={"2.5vh"} height={"2.5vh"} /> FIRE POWER{" "}
      <FireIcon width={"2.5vh"} height={"2.5vh"} />
    </div>
    <div className="bg-black/50 rounded-full h-[3.2vh] overflow-hidden border-2 border-white/30  shadow-inner relative">
      {/* Track marks */}
      <div className="absolute inset-0 flex justify-between px-[1vw] opacity-30">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-[0.2vw] h-full bg-white/50" />
        ))}
      </div>

      <div
        className="h-full transition-all duration-300 relative"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90.04deg, #FFCA39 0.84%, #FFFFFC 99.98%), #D9D9D9",
        }}
      >
        {/* Glare effect */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20" />
        {/* Head indicator */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[2vh] aspect-square bg-white rounded-full shadow-[0_0_10px_white]" />
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
    @keyframes fire-float {
      0% { opacity: 0; transform: translateY(0) scale(0.5); }
      20% { opacity: 1; transform: translateY(-2vh) scale(1.1); }
      50% { opacity: 0.8; transform: translateY(-5vh) scale(0.9); }
      100% { opacity: 0; transform: translateY(-15vh) rotate(15deg) scale(0.6); }
    }
  `}</style>
);
