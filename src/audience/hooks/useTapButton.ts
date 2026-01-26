import { useState, useRef, useEffect, useMemo } from "react";
import type { ButtonLayout } from "../../common/types";

export type TapTier = "normal" | "heat" | "fire" | "infinite";

export function useTapStreak() {
  const [streak, setStreak] = useState(0);
  const timeoutRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const incrementStreak = () => {
    setStreak((s) => s + 1);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setStreak(0),
      500,
    ) as unknown as number;
  };

  const currentTier: TapTier = useMemo(() => {
    if (streak > 150) return "infinite";
    if (streak > 100) return "fire";
    if (streak > 50) return "heat";
    return "normal";
  }, [streak]);

  return { streak, incrementStreak, currentTier };
}

export function useChaosMode(layout: ButtonLayout) {
  const [position, setPosition] = useState({ top: "50%", left: "50%" });

  const moveChaos = () => {
    if (layout !== "chaos") return;
    const top = Math.random() * 80 + 10;
    const left = Math.random() * 80 + 10;
    setPosition({ top: `${top}%`, left: `${left}%` });
  };

  useEffect(() => {
    if (layout === "chaos") moveChaos();
    else setPosition({ top: "50%", left: "50%" });
  }, [layout]);

  return { position, moveChaos };
}
