import { GamePhase, type GameState } from "../../common/types";

interface Props {
  gameState: GameState;
}

export function SamplingMonitor({ gameState }: Props) {
  if (gameState.phase !== GamePhase.RACING) return null;

  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-gray-400 text-sm uppercase font-bold mb-4 text-green-400 animate-pulse">
        ⚡ Live Sampling Monitor (Active Tappers)
      </h2>
      <div className="overflow-x-auto">
        {gameState.sampledClients && gameState.sampledClients.length > 0 ? (
          <div className="flex gap-4 pb-2">
            {gameState.sampledClients.map((client, idx) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-600 p-4 rounded-lg min-w-[120px] text-center transform transition-all hover:scale-105"
              >
                <div className="text-xs text-gray-500 mb-1">DEVICE</div>
                <div className="text-xl font-bold text-white font-mono mb-2">
                  #{client.luckyNumber}
                </div>
                <div className="text-xs text-gray-500">TAPS (100ms)</div>
                <div className="text-2xl font-black text-yellow-400 leading-none">
                  {client.taps}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic py-4 text-center bg-gray-900/30 rounded-lg">
            Sampling devices...
          </div>
        )}
      </div>
    </section>
  );
}
