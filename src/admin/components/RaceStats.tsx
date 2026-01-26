import { GamePhase, type GameState } from "../../common/types";

interface Props {
  gameState: GameState;
}

export function RaceStats({ gameState }: Props) {
  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-gray-400 text-sm uppercase font-bold mb-4">
        Race Overview
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <span className="block text-gray-400 text-xs">PHASE</span>
          <span className="text-2xl font-mono font-bold text-white">
            {gameState.phase}
          </span>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <span className="block text-gray-400 text-xs text-right">
            ACTIVE RACE
          </span>
          <span className="block text-2xl font-mono text-yellow-400 text-right truncate">
            {gameState.raceName || gameState.raceConfigId || "None"}
          </span>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <span className="block text-gray-400 text-xs">TOTAL CONNECTIONS</span>
          <span className="text-3xl font-mono text-blue-400 font-bold">
            {gameState.connectedDevices || 0}
          </span>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <span className="block text-gray-400 text-xs text-right">
            AUDIENCE (PLAYERS)
          </span>
          <span className="block text-3xl font-mono text-green-400 font-bold text-right">
            {gameState.audienceCount || 0}
          </span>
        </div>
      </div>

      {/* Admin Progress Bar */}
      {gameState.phase === GamePhase.RACING && (
        <div className="mt-4 p-4 bg-black/20 rounded-lg">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Race Duration</span>
            <span>{Math.round(gameState.progress || 0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
            <div
              className="bg-yellow-500 h-full transition-all duration-300"
              style={{ width: `${gameState.progress || 0}%` }}
            />
          </div>
          <div className="text-center font-mono text-xs text-yellow-600">
            Current Horse Speed: {Math.round(gameState.speed || 0)}
          </div>
        </div>
      )}
    </section>
  );
}
