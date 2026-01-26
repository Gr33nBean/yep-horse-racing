import { useState } from "react";
import { socket } from "../../services/socket";
import { GamePhase, type GameState } from "../../common/types";
import { PRIZE_LEVELS } from "../../common/constants";

export function AdminOverlay({ gameState }: { gameState: GameState }) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);

  const startRace = () => {
    if (selectedRace) {
      socket.emit("admin:startRace", {
        raceConfigId: selectedRace,
        delaySeconds: 5,
      });
      setSelectedRace(null);
      setIsVisible(false); // Hide overlay on start
    }
  };

  const resetGame = () => {
    if (confirm("Are you sure you want to RESET the game?")) {
      socket.emit("admin:reset");
      setIsVisible(false);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-[9999] opacity-0 hover:opacity-100 transition-opacity bg-gray-900/80 text-white p-2 text-xs rounded-full border border-gray-700"
      >
        ⚙️ Admin
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-4xl w-full shadow-2xl relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕ Close
        </button>

        <h1 className="text-3xl font-bold text-yellow-500 mb-8 border-b border-gray-800 pb-4">
          Admin Control Overlay
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-gray-400 text-sm uppercase font-bold mb-4">
              Start Race
            </h2>
            <div className="space-y-3">
              {PRIZE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedRace(level.id)}
                  disabled={gameState.phase === GamePhase.RACING}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedRace === level.id
                      ? "bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/50"
                      : "bg-gray-800 border-gray-700 hover:bg-gray-750"
                  }`}
                >
                  <h3 className="font-bold text-lg">{level.name}</h3>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-gray-400 text-sm uppercase font-bold mb-4">
                Confirm
              </h2>
              {selectedRace ? (
                <div className="p-6 bg-yellow-900/30 border border-yellow-600 rounded-xl">
                  <p className="text-gray-300 mb-4">
                    Selected:{" "}
                    <span className="font-bold text-white">
                      {PRIZE_LEVELS.find((l) => l.id === selectedRace)?.name}
                    </span>
                  </p>
                  <button
                    onClick={startRace}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-xl shadow-lg"
                  >
                    START RACE 🚀
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 italic">
                  Select a race type to enable start...
                </p>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <button
                onClick={resetGame}
                className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-800/30 rounded-lg flex items-center justify-center gap-2"
              >
                ⚠️ RESET SYSTEM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
