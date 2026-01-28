import { useTapStreak, useChaosMode, type TapTier } from "./hooks/useTapButton";
import { usePerformanceEffects } from "./hooks/useDevicePerformance";
import { type ButtonLayout } from "../common/types";

interface TapButtonProps {
  onTap: () => void;
  layout?: ButtonLayout;
}

export function TapButton({ onTap, layout = "classic" }: TapButtonProps) {
  const { streak, incrementStreak, currentTier } = useTapStreak();
  const { position, moveChaos } = useChaosMode(layout);
  const { settings } = usePerformanceEffects();

  const handlePointerDown = () => {
    onTap();
    moveChaos();
    incrementStreak();
  };

  const styles = getButtonStyles(
    currentTier,
    layout === "small",
    settings.enableGradients,
  );
  const shakeClass =
    settings.enableShake && streak > 20 ? "shake-animation" : "";

  // Chaos positioning styles
  const containerStyles =
    layout === "chaos"
      ? {
          position: "absolute" as const,
          top: position.top,
          left: position.left,
          transform: "translate(-50%, -50%)",
          transition: settings.enableAnimations
            ? "top 0.15s ease-out, left 0.15s ease-out"
            : "none",
          width: "auto",
          height: "auto",
        }
      : {
          position: "relative" as const,
          width: "100%",
          height: "100%",
        };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden">
      {/* Streak Display */}
      {settings.enableStreakDisplay && (
        <StreakDisplay
          streak={streak}
          tier={currentTier}
          enableBounce={settings.enableStreakBounce}
        />
      )}

      {/* Button Wrapper */}
      <div
        className={`${shakeClass} flex items-center justify-center`}
        style={containerStyles}
      >
        <button
          className="tap-btn rounded-full flex items-center justify-center select-none outline-none relative overflow-hidden"
          onPointerDown={handlePointerDown}
          style={{
            width: styles.size,
            height: styles.size,
            maxWidth: "90vh",
            maxHeight: "90vw",
            background: styles.background,
            boxShadow: settings.enableShadows ? styles.boxShadow : "none",
            borderColor: styles.borderColor,
            transition: settings.enableAnimations
              ? "width 0.3s, height 0.3s, background 0.3s"
              : "none",
          }}
        >
          {/* Pulse effect for fire mode (only on high-performance devices) */}
          {settings.enablePulse &&
            (currentTier === "fire" || currentTier === "infinite") && (
              <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-full pointer-events-none" />
            )}

          <div className="text-center pointer-events-none z-10">
            <span
              className="block font-black text-white tracking-wider"
              style={{
                fontSize: styles.fontSize,
                textShadow: settings.enableShadows
                  ? "0 2px 4px rgba(0,0,0,0.3)"
                  : "none",
              }}
            >
              {styles.text}
            </span>
            <span className="block text-sm font-bold text-white/90 mt-2 uppercase tracking-widest">
              {styles.subText}
            </span>
          </div>
        </button>
      </div>

      {/* Performance indicator (dev only - can be removed) */}
      {/* <div className="absolute bottom-2 right-2 text-xs text-white/50">{tier}</div> */}

      <style>{`
        .tap-btn {
          border-width: 6px;
          border-style: solid;
          transform: scale(1) translate3d(0,0,0);
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
          ${settings.enableAnimations ? "will-change: transform, width, height;" : ""}
        }

        .tap-btn:active {
          transform: scale(0.95) translate3d(0,0,0);
        }

        ${
          settings.enableShake
            ? `
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
        `
            : ""
        }
      `}</style>
    </div>
  );
}

interface StreakDisplayProps {
  streak: number;
  tier: TapTier;
  enableBounce: boolean;
}

function StreakDisplay({ streak, tier, enableBounce }: StreakDisplayProps) {
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
      <div
        className={enableBounce ? "animate-bounce" : ""}
        style={{ textAlign: "center" }}
      >
        <span
          className="block font-black italic tracking-tighter"
          style={{
            color: tierColors[tier],
            fontSize: tier === "infinite" ? "6rem" : "4rem",
            textShadow: "0 0 20px rgba(0,0,0,0.8)",
          }}
        >
          {streak}
        </span>
        <span className="block text-lg font-bold text-white uppercase tracking-widest bg-black/30 px-4 py-1 rounded-full">
          {tierLabels[tier]}
        </span>
      </div>
    </div>
  );
}

function getButtonStyles(
  tier: TapTier,
  isSmall: boolean,
  enableGradients: boolean,
) {
  const baseSize = isSmall ? 120 : 220;

  // Solid color fallbacks for low-performance devices
  const solidColors = {
    infinite: "#b45309",
    fire: "#d97706",
    heat: "#c2410c",
    normal: "#b91c1c",
  };

  switch (tier) {
    case "infinite":
      return {
        background: enableGradients
          ? "radial-gradient(circle at center, #fbbf24 0%, #b45309 60%, #7c2d12 100%)"
          : solidColors.infinite,
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
        background: enableGradients
          ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
          : solidColors.fire,
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
        background: enableGradients
          ? "linear-gradient(135deg, #f97316 0%, #c2410c 100%)"
          : solidColors.heat,
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
        background: enableGradients
          ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
          : solidColors.normal,
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
