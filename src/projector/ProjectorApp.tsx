import { useGameSync } from "../services/useGameSync";
import { GamePhase } from "../common/types";
import { HorseTrack } from "./components/HorseTrack";
import { WaitingRoom } from "./components/WaitingRoom";
import { ProjectorAudio } from "./components/ProjectorAudio";
import { CountdownOverlay } from "./components/CountdownOverlay";

export default function ProjectorApp() {
  const { gameState } = useGameSync();

  return (
    <div className="flex size-full bg-black text-white p-6">
      {/* Audio Manager */}
      <ProjectorAudio gameState={gameState} />

      <div className="flex-1 relative h-full">
        {/* Main Projector View */}
        <div className="h-full border-4 border-gray-900 rounded-3xl flex items-center justify-center bg-gray-950 p-6 relative overflow-hidden shadow-2xl">
          {gameState.phase === GamePhase.RACING ||
          gameState.phase === GamePhase.RESULT ? (
            <HorseTrack gameState={gameState} />
          ) : (
            // WAITING SCREEN
            <WaitingRoom gameState={gameState} />
          )}

          {/* Countdown Overlay */}
          <CountdownOverlay gameState={gameState} />
        </div>
      </div>
    </div>
  );
}
