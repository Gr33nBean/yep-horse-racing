import { useEffect, useState } from "react";

const COUNTDOWN_FROM = 3;

export function CountdownScreen() {
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);

  useEffect(() => {
    // Start countdown immediately on mount
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000); // Decrement every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center space-y-6">
      <h2 className="text-4xl font-black text-white uppercase tracking-tighter animate-pulse">
        GET READY!
      </h2>
      <div className="text-[12rem] leading-none font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-110 transition-transform duration-1000">
        {countdown}
      </div>
      <p className="text-xl text-gray-300">Tap fast when it starts!</p>
    </div>
  );
}
