import { useRef, useEffect, useCallback } from "react";
import { socket } from "../../services/socket";
import { GamePhase, type GameState } from "../../common/types";

/**
 * Optimized Tap Processor - Minimal Server Load
 *
 * Strategy:
 * - Client counts taps locally (no immediate server communication)
 * - Server samples random clients for SPEED calculation only
 * - At race END, client reports FINAL tap count once
 *
 * This reduces server load from thousands of events to:
 * - 5 sample requests per 200ms during race (for speed)
 * - 1 final report per client at race end (for scoring)
 */
export function useTapProcessor(gameState: GameState) {
  const tapCountRef = useRef(0);
  const hasReportedFinalRef = useRef(false);

  // Function to handle user tap - purely local
  const handleTap = useCallback(() => {
    if (gameState.phase !== GamePhase.RACING) return false;
    tapCountRef.current += 1;
    return true;
  }, [gameState.phase]);

  // Listen for server tap requests (sampling for speed calculation)
  useEffect(() => {
    if (gameState.phase !== GamePhase.RACING) {
      return;
    }

    function onRequestTaps(
      _data: unknown,
      callback: (response: { taps: number }) => void,
    ) {
      // Return current tap count for speed calculation
      callback({ taps: tapCountRef.current });
    }

    socket.on("requestTaps", onRequestTaps);

    return () => {
      socket.off("requestTaps", onRequestTaps);
    };
  }, [gameState.phase]);

  // Report final taps when race ends
  useEffect(() => {
    if (gameState.phase === GamePhase.RESULT && !hasReportedFinalRef.current) {
      hasReportedFinalRef.current = true;

      const finalTaps = tapCountRef.current;
      if (finalTaps > 0) {
        // Send final tap count to server for scoring
        socket.emit("client:finalTaps", { count: finalTaps });
        console.log(`[TapProcessor] Reported final taps: ${finalTaps}`);
      }
    }

    // Reset for next race
    if (gameState.phase === GamePhase.WAITING) {
      tapCountRef.current = 0;
      hasReportedFinalRef.current = false;
    }
  }, [gameState.phase]);

  // Reset on phase change to RACING
  useEffect(() => {
    if (gameState.phase === GamePhase.RACING) {
      tapCountRef.current = 0;
      hasReportedFinalRef.current = false;
    }
  }, [gameState.phase]);

  return {
    handleTap,
    getCurrentSessionTaps: () => tapCountRef.current,
  };
}
