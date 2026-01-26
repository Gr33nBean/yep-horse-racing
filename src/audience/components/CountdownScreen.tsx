import { useEffect, useState } from "react";

interface Props {
  startTime?: number;
}

export function CountdownScreen({ startTime }: Props) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((startTime - Date.now()) / 1000);
        setCountdown(Math.max(0, remaining));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime]);

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
