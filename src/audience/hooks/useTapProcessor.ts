import { useRef, useEffect, useCallback } from "react";
import { socket } from "../../services/socket";
import { GamePhase, type GameState } from "../../common/types";

export function useTapProcessor(gameState: GameState) {
  const tapCountRef = useRef(0);
  const accumulatedTapsRef = useRef(0);

  // Function to handle user tap
  const handleTap = useCallback(() => {
    if (gameState.phase !== GamePhase.RACING) return;

    tapCountRef.current += 1;
    // Visual feedback logic can go here (return boolean or trigger callback)
    return true;
  }, [gameState.phase]);

  // Listen for server tap requests (sampling)
  useEffect(() => {
    if (gameState.phase !== GamePhase.RACING) {
      console.log(`[TapProcessor] Not racing, phase is ${gameState.phase}`);
      return;
    }

    console.log(`[TapProcessor] Listening for tap requests from server`);

    function onRequestTaps(
      _data: unknown,
      callback: (response: { taps: number }) => void,
    ) {
      const tapsToSend = tapCountRef.current;

      if (tapsToSend > 0) {
        console.log(`[Client] Server requested taps, sending ${tapsToSend}`);

        // Send taps to server
        callback({ taps: tapsToSend });

        // Update accumulated and reset counter
        accumulatedTapsRef.current += tapsToSend;
        tapCountRef.current = 0;
      } else {
        // Send 0 if no taps
        callback({ taps: 0 });
      }
    }

    socket.on("requestTaps", onRequestTaps);

    return () => {
      console.log(`[TapProcessor] Removing tap request listener`);
      socket.off("requestTaps", onRequestTaps);
    };
  }, [gameState.phase]);

  return {
    handleTap,
    getCurrentSessionTaps: () =>
      accumulatedTapsRef.current + tapCountRef.current,
  };
}
