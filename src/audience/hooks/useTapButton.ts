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

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimate button radius (half of button size)
    // Max button size is around 330px (90vw on small screens or 220px base * 1.5)
    const buttonRadius = Math.min(viewportWidth * 0.35, 165);

    // Calculate bounds - button center can be from buttonRadius to (viewport - buttonRadius)
    const minX = buttonRadius;
    const maxX = viewportWidth - buttonRadius;
    const minY = buttonRadius;
    const maxY = viewportHeight - buttonRadius;

    // Generate random position within bounds
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;

    setPosition({
      top: `${y}px`,
      left: `${x}px`,
    });
  };

  useEffect(() => {
    if (layout === "chaos") moveChaos();
    else setPosition({ top: "50%", left: "50%" });
  }, [layout]);

  return { position, moveChaos };
}
