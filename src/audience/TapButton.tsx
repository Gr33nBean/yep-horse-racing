import { useTapStreak, useChaosMode, type TapTier } from "./hooks/useTapButton";
import { type ButtonLayout } from "../common/types";

interface TapButtonProps {
  onTap: () => void;
  layout?: ButtonLayout;
}

export function TapButton({ onTap, layout = "classic" }: TapButtonProps) {
  const { streak, incrementStreak, currentTier } = useTapStreak();
  const { position, moveChaos } = useChaosMode(layout);

  const handlePointerDown = () => {
    onTap();
    moveChaos();
    incrementStreak();
  };

  const styles = getButtonStyles(currentTier, layout === "small");
  const shakeClass = streak > 20 ? "shake-animation" : "";

  // Chaos positioning styles
  const containerStyles =
    layout === "chaos"
      ? {
          position: "absolute" as const,
          top: position.top,
          left: position.left,
          transform: "translate(-50%, -50%)",
          transition: "top 0.2s, left 0.2s",
          width: "auto",
          height: "auto",
        }
      : {
          position: "relative" as const,
          width: "100%",
          height: "100%",
        };

  return (
    <div className="relative flex flex-col items-center justify-center transition-all duration-300 w-full h-full overflow-hidden">
      {/* Streak Display */}
      <StreakDisplay streak={streak} tier={currentTier} />

      {/* Button Wrapper */}
      <div
        className={`${shakeClass} flex items-center justify-center`}
        style={containerStyles}
      >
        <button
          className="tap-btn rounded-full flex items-center justify-center select-none outline-none relative overflow-hidden transition-all duration-300"
          onPointerDown={handlePointerDown}
          style={{
            width: styles.size,
            height: styles.size,
            maxWidth: "90vh",
            maxHeight: "90vw",
            background: styles.background,
            boxShadow: styles.boxShadow,
            borderColor: styles.borderColor,
          }}
        >
          {/* Subtle pulse for fire mode */}
          {(currentTier === "fire" || currentTier === "infinite") && (
            <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-full pointer-events-none" />
          )}

          <div className="text-center pointer-events-none z-10">
            <span
              className="block font-black text-white drop-shadow-md tracking-wider transition-all duration-300"
              style={{ fontSize: styles.fontSize }}
            >
              {styles.text}
            </span>
            <span className="block text-sm font-bold text-white/90 mt-2 uppercase tracking-widest">
              {styles.subText}
            </span>
          </div>
        </button>
      </div>

      <style>{`
        .tap-btn {
          border-width: 6px;
          border-style: solid;
          transform: scale(1) translate3d(0,0,0);
          transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s;
          -webkit-tap-highlight-color: transparent;
          touch-action: none; 
          will-change: transform, width, height;
        }

        .tap-btn:active {
          transform: scale(0.95) translate3d(0,0,0);
        }

        .shake-animation {
          animation: shake 0.3s infinite linear;
          will-change: transform;
        }

        @keyframes shake {
          0% { transform: translate3d(2px, 2px, 0); }
          25% { transform: translate3d(-2px, -3px, 0); }
          50% { transform: translate3d(-3px, 3px, 0); }
          75% { transform: translate3d(3px, -2px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </div>
  );
}

function StreakDisplay({ streak, tier }: { streak: number; tier: TapTier }) {
  if (streak <= 5) return null;

  const tierColors = {
    infinite: "#fff",
    fire: "#fbbf24",
    heat: "#fdba74",
    normal: "#fdba74",
  };

  const tierLabels = {
    infinite: "GODLIKE!!!",
    fire: "UNSTOPPABLE!",
    heat: "COMBO!",
    normal: "COMBO!",
  };

  return (
    <div className="fixed top-12 left-0 right-0 pointer-events-none flex flex-col items-center justify-start z-50">
      <div className="animate-bounce text-center">
        <span
          className="block font-black italic tracking-tighter stroke-black drop-shadow-xl transition-all duration-300"
          style={{
            color: tierColors[tier],
            fontSize: tier === "infinite" ? "6rem" : "4rem",
            textShadow: "0 0 20px rgba(0,0,0,0.8)",
          }}
        >
          {streak}
        </span>
        <span className="block text-lg font-bold text-white uppercase tracking-widest drop-shadow-md bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">
          {tierLabels[tier]}
        </span>
      </div>
    </div>
  );
}

function getButtonStyles(tier: TapTier, isSmall: boolean) {
  const baseSize = isSmall ? 120 : 220;

  switch (tier) {
    case "infinite":
      return {
        background:
          "radial-gradient(circle at center, #fbbf24 0%, #b45309 60%, #7c2d12 100%)",
        boxShadow:
          "0 0 100px rgba(251, 191, 36, 1), inset 0 0 30px rgba(255,255,255,0.8)",
        borderColor: "#fff",
        text: "∞",
        subText: "LEGENDARY!",
        size: isSmall ? "150px" : "90vw",
        fontSize: isSmall ? "3rem" : "6rem",
      };
    case "fire":
      return {
        background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
        boxShadow:
          "0 10px 50px rgba(251, 191, 36, 0.8), inset 0 2px 10px rgba(255,255,255,0.5)",
        borderColor: "#fde68a",
        text: "MAX!",
        subText: "UNSTOPPABLE!",
        size: `${baseSize * 1.5}px`,
        fontSize: isSmall ? "2rem" : "4.5rem",
      };
    case "heat":
      return {
        background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
        boxShadow:
          "0 10px 35px rgba(249, 115, 22, 0.7), inset 0 2px 5px rgba(255,255,255,0.3)",
        borderColor: "#fdba74",
        text: "FASTER!",
        subText: "ON FIRE!",
        size: `${baseSize * 1.2}px`,
        fontSize: isSmall ? "1.5rem" : "3.5rem",
      };
    default:
      return {
        background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        boxShadow:
          "0 10px 20px rgba(220, 38, 38, 0.5), inset 0 2px 5px rgba(255,255,255,0.2)",
        borderColor: "#fca5a5",
        text: "TAP!",
        subText: "Rapidly",
        size: `${baseSize}px`,
        fontSize: isSmall ? "1.2rem" : "3rem",
      };
  }
}
