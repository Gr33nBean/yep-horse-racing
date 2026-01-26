import { useEffect, useRef, useState } from "react";
import { GamePhase, type GameState } from "../../common/types";
import { AUDIO_CONFIG } from "../../common/constants/audio";
import { PRIZE_LEVELS } from "../../common/constants";
import { socket } from "../../services/socket";

interface Props {
  gameState: GameState;
  onReady?: () => void;
}

export function ProjectorAudio({ gameState, onReady }: Props) {
  const bgmRef = useRef<HTMLAudioElement>(null);
  const startSfxRef = useRef<HTMLAudioElement>(null);
  const finishSfxRef = useRef<HTMLAudioElement>(null);

  const [lastVolume, setLastVolume] = useState(AUDIO_CONFIG.DEFAULT_VOLUME);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [finishSfxTriggered, setFinishSfxTriggered] = useState(false);
  const [isDucking, setIsDucking] = useState(false);

  // Enable Audio Context
  const enableAudio = () => {
    setIsAudioReady(true);
    if (onReady) onReady();

    // Try to unlock all audio elements
    [bgmRef, startSfxRef, finishSfxRef].forEach((ref) => {
      if (ref.current) {
        ref.current.load();
        ref.current
          .play()
          .then(() => {
            ref.current?.pause();
            ref.current!.currentTime = 0;
          })
          .catch(() => {});
      }
    });
  };

  // 1. Sync Volume & Ducking
  useEffect(() => {
    if (bgmRef.current) {
      // Lower BGM significantly if ducking (Finish phase)
      bgmRef.current.volume = isDucking
        ? Math.max(0, lastVolume * 0.3)
        : lastVolume;
    }
    if (startSfxRef.current) startSfxRef.current.volume = lastVolume;
    if (finishSfxRef.current) finishSfxRef.current.volume = lastVolume;
  }, [lastVolume, isDucking]);

  // 2. Admin Volume Control
  useEffect(() => {
    const handleMusicControl = (action: {
      type: "play" | "stop" | "volume";
      value?: number;
    }) => {
      if (action.type === "volume" && typeof action.value === "number") {
        setLastVolume(action.value / 100);
      }
    };

    socket.on("projector:controlMusic", handleMusicControl);
    return () => {
      socket.off("projector:controlMusic", handleMusicControl);
    };
  }, []);

  // 3. Phase Transition Logic (Start/Stop)
  useEffect(() => {
    if (!isAudioReady) return;

    if (gameState.phase === GamePhase.COUNTDOWN) {
      // === COUNTDOWN START ===
      console.log("Audio: Countdown Started (Playing Start SFX)");
      startSfxRef.current
        ?.play()
        .catch((e) => console.warn("Start SFX error", e));
    } else if (gameState.phase === GamePhase.RACING) {
      // === RACE START ===
      console.log("Audio: Race Started (Playing BGM)");
      setFinishSfxTriggered(false);
      setIsDucking(false);

      if (bgmRef.current) {
        bgmRef.current.currentTime = 0;
        bgmRef.current.play().catch((e) => console.warn("BGM error", e));
      }
    } else if (
      gameState.phase === GamePhase.RESULT ||
      gameState.phase === GamePhase.WAITING
    ) {
      // === STOP / RESULT / WAITING ===
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
      if (gameState.phase === GamePhase.WAITING && startSfxRef.current) {
        startSfxRef.current.pause();
        startSfxRef.current.currentTime = 0;
      }
      setIsDucking(false);
    }
  }, [gameState.phase, isAudioReady]);

  // 4. Progress Logic (Finish SFX)
  useEffect(() => {
    if (
      !isAudioReady ||
      gameState.phase !== GamePhase.RACING ||
      finishSfxTriggered
    )
      return;

    // Use raceDuration from state (custom) or fallback to config lookup (legacy)
    let durationSeconds = gameState.raceDuration;
    if (!durationSeconds) {
      const currentConfig = PRIZE_LEVELS.find(
        (l) => l.id === gameState.raceConfigId,
      );
      durationSeconds = currentConfig?.durationSeconds;
    }

    if (!durationSeconds || !gameState.progress) return;

    const durationMs = durationSeconds * 1000;
    const elapsedMs = (gameState.progress / 100) * durationMs;
    const remainingMs = durationMs - elapsedMs;

    if (remainingMs <= 5000 && remainingMs > 1000) {
      console.log("Audio: Finish Sequence");
      setFinishSfxTriggered(true);
      setIsDucking(true);
      finishSfxRef.current?.play().catch(console.error);
    }
  }, [
    gameState.progress,
    gameState.phase,
    isAudioReady,
    finishSfxTriggered,
    gameState.raceConfigId,
    gameState.raceDuration,
  ]);

  if (!isAudioReady) {
    return (
      <div
        onClick={enableAudio}
        className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center cursor-pointer"
      >
        <div className="text-6xl mb-4">🔇 ➔ 🔊</div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Click to Enable Audio
        </h1>
        <p className="text-gray-400">Automated Sound System Ready</p>
      </div>
    );
  }

  return (
    <>
      <audio ref={bgmRef} src={AUDIO_CONFIG.BGM} loop preload="auto" />
      <audio ref={startSfxRef} src={AUDIO_CONFIG.START_SFX} preload="auto" />
      <audio ref={finishSfxRef} src={AUDIO_CONFIG.FINISH_SFX} preload="auto" />
    </>
  );
}
