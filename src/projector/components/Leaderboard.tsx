import { useEffect, useState } from "react";
import { socket } from "../../services/socket";

interface LeaderboardItem {
  id: string; // Lucky number
  score: number;
}

export function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    function onLeaderboard(data: LeaderboardItem[]) {
      setItems(data);
    }
    socket.on("leaderboard", onLeaderboard);
    return () => {
      socket.off("leaderboard", onLeaderboard);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900/90 border border-gray-700 rounded-lg p-4 shadow-xl backdrop-blur">
      <h3 className="text-yellow-400 font-bold mb-3 uppercase text-sm tracking-wider">
        Top Tappers
      </h3>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex justify-between items-center text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold w-5 ${
                  idx === 0
                    ? "text-yellow-400"
                    : idx === 1
                      ? "text-gray-300"
                      : idx === 2
                        ? "text-orange-400"
                        : "text-gray-600"
                }`}
              >
                #{idx + 1}
              </span>
              <span className="font-mono text-white">{item.id}</span>
            </div>
            <span className="text-gray-400 font-mono">{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
