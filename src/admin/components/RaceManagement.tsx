import { useState } from "react";
import { socket } from "../../services/socket";
import {
  GamePhase,
  type ButtonLayout,
  type GameState,
} from "../../common/types";
import { PRIZE_LEVELS } from "../../common/constants";
import { GAME_CONFIG } from "../../common/constants/gameConfig";

interface Props {
  gameState: GameState;
}

export function RaceManagement({ gameState }: Props) {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [buttonLayout, setButtonLayout] = useState<ButtonLayout>("classic");

  const startRace = () => {
    if (selectedRace && customDuration) {
      socket.emit("admin:startRace", {
        name: selectedRace,
        durationSeconds: customDuration,
        delaySeconds: GAME_CONFIG.COUNTDOWN_SECONDS,
        buttonLayout,
      });
      // We don't clear state here so admin can easily restart same config
    }
  };

  return (
    <section className="space-y-4 pt-4 border-t border-gray-800">
      <h2 className="text-gray-400 text-sm uppercase font-bold">
        Race Management (Flexible)
      </h2>

      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Race Name Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-bold">RACE NAME</label>
            <input
              type="text"
              value={selectedRace || ""}
              onChange={(e) => setSelectedRace(e.target.value)}
              placeholder="e.g. Chung Kết / Final Round"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            />
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-bold">
              DURATION (SECONDS)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="10"
                max="300"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <span className="text-gray-500 text-sm">seconds</span>
            </div>
          </div>
          {/* Button Layout Selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-bold">
              BUTTON LAYOUT (DIFFICULTY)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["classic", "small", "chaos"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setButtonLayout(mode)}
                  className={`px-2 py-3 rounded-lg text-sm font-bold uppercase border transition-all ${
                    buttonLayout === mode
                      ? "bg-yellow-500 text-black border-yellow-400 shadow-md"
                      : "bg-gray-900 text-gray-400 border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase font-bold">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIZE_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => {
                  setSelectedRace(level.name);
                  setCustomDuration(level.durationSeconds);
                  setButtonLayout("classic"); // Default reset
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300 border border-gray-600 transition-colors active:scale-95 touch-manipulation"
              >
                {level.name} ({level.durationSeconds}s)
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={startRace}
            disabled={
              !selectedRace ||
              !customDuration ||
              gameState.phase === GamePhase.RACING
            }
            className={`w-full py-4 rounded-xl font-bold text-xl uppercase tracking-wider shadow-lg transition-transform active:scale-95 ${
              !selectedRace ||
              !customDuration ||
              gameState.phase === GamePhase.RACING
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black border-2 border-yellow-400"
            }`}
          >
            {gameState.phase === GamePhase.RACING
              ? "Race in Progress..."
              : "Start Custom Race 🚀"}
          </button>
        </div>
      </div>
    </section>
  );
}
