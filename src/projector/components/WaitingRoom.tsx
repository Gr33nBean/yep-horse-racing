import { socket } from "../../../src/services/socket";
import { useEffect, useState } from "react";
import { type GameState } from "../../common/types";

interface Props {
  gameState: GameState;
}

export function WaitingRoom({ gameState }: Props) {
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);

  useEffect(() => {
    const handleTestSignal = ({ luckyNumber }: { luckyNumber: string }) => {
      setHighlightedUser(luckyNumber);
      // Remove highlight after 500ms
      setTimeout(() => setHighlightedUser(null), 1000);
    };

    socket.on("server:testSignal", handleTestSignal);
    return () => {
      socket.off("server:testSignal", handleTestSignal);
    };
  }, []);
  const users = gameState.connectedUsers || [];
  // Merge real users with test data (as per user request for testing)
  const allUsers = users
    .map(String) // Ensure all are strings for consistent comparison
    .filter((num) => !isNaN(Number(num)))
    .sort((a, b) => Number(a) - Number(b));

  // Count occurrences to detect duplicates
  const counts: Record<string, number> = {};
  allUsers.forEach((num) => {
    counts[num] = (counts[num] || 0) + 1;
  });

  return (
    <div className="flex flex-col size-full bg-gray-950 text-white overflow-hidden p-6 gap-4">
      {/* Header Compact */}
      <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shrink-0 h-[15%]">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tighter">
            Waiting Room
          </h1>
          <p className="text-xl text-gray-400 flex items-center gap-2">
            Join at:{" "}
            <span className="text-white font-mono bg-white/10 px-2 rounded-md">
              running.yep24.com
            </span>
          </p>
        </div>

        {/* Live Counter */}
        <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-xl border border-gray-700">
          <span className="text-5xl animate-pulse">👥</span>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase font-bold">
              Ready
            </div>
            <div className="text-5xl font-mono font-black text-white tabular-nums">
              {allUsers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Area - Full Height */}
      <div className="flex-1 bg-black/20 rounded-2xl border border-gray-800/50 p-4 relative overflow-hidden ">
        {allUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 animate-pulse">
            <span className="text-6xl mb-4">⏳</span>
            <span className="text-3xl font-light">Waiting for players...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 h-full overflow-hidden justify-center content-start overflow-y-auto">
            {allUsers.map((num, idx) => {
              const isDuplicate = counts[num] > 1;
              const isHighlighted = highlightedUser === num;
              return (
                <div
                  key={`${num}-${idx}`}
                  className={`
                    border rounded-md w-16 h-10 flex items-center justify-center shadow-sm transition-all duration-300 animate-in fade-in zoom-in
                    ${
                      isHighlighted
                        ? "bg-green-500 border-green-300 scale-125 z-10 shadow-[0_0_20px_rgba(34,197,94,0.8)]" // Highlight Style (Test Signal)
                        : isDuplicate
                          ? "bg-red-900/80 border-red-500 animate-pulse text-red-100" // Warning Style
                          : "bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-yellow-500/50 text-white" // Normal Style
                    }
                  `}
                >
                  <span className="text-xl font-bold font-mono tracking-tight">
                    {num}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
