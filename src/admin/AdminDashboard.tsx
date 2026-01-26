import { socket } from "../services/socket";
import { useGameSync } from "../services/useGameSync";
import { AdminLeaderboard } from "./components/AdminLeaderboard";
import { AdminHeader } from "./components/AdminHeader";
import { RaceStats } from "./components/RaceStats";
import { AudioControl } from "./components/AudioControl";
import { SamplingMonitor } from "./components/SamplingMonitor";
import { RaceManagement } from "./components/RaceManagement";

export default function AdminDashboard() {
  const { isConnected, gameState } = useGameSync();

  const resetGame = () => {
    socket.emit("admin:reset");
  };

  return (
    <div className="size-full bg-gray-900 text-white p-4 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <AdminHeader isConnected={isConnected} />

        {/* Status Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RaceStats gameState={gameState} />
          <AudioControl />
        </div>

        {/* Real-time Sampling Monitor */}
        <SamplingMonitor gameState={gameState} />

        {/* Leaderboard & Actions */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-gray-400 text-sm uppercase font-bold mb-4">
            Total Taps Leaderboard
          </h2>
          <AdminLeaderboard />
        </section>

        {/* Race Management */}
        <RaceManagement gameState={gameState} />

        {/* Danger Zone */}
        <section className="pt-8 border-t border-gray-800 text-center">
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm transition-colors"
          >
            ⚠️ EMERGENCY RESET SYSTEM
          </button>
        </section>
      </div>
    </div>
  );
}
