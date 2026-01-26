import { useEffect, useState } from "react";
import { socket } from "../../services/socket";

interface LeaderboardEntry {
  id: string;
  score: number;
}

export function AdminLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    function onLeaderboard(data: LeaderboardEntry[]) {
      setLeaderboard(data);
    }

    socket.on("leaderboard", onLeaderboard);

    return () => {
      socket.off("leaderboard", onLeaderboard);
    };
  }, []);

  if (leaderboard.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic text-center py-4">
        No taps yet. Waiting for race to start...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => (
        <div
          key={entry.id}
          className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-lg font-bold ${
                index === 0
                  ? "text-yellow-400"
                  : index === 1
                    ? "text-gray-300"
                    : index === 2
                      ? "text-orange-400"
                      : "text-gray-500"
              }`}
            >
              #{index + 1}
            </span>
            <span className="font-mono text-white">Lucky #{entry.id}</span>
          </div>
          <span className="text-yellow-400 font-bold">{entry.score} taps</span>
        </div>
      ))}
    </div>
  );
}
