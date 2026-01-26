import { useEffect, useState } from "react";
import { socket } from "./socket";
import { GamePhase, type GameState } from "../common/types";

export function useGameSync() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.WAITING,
  });

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log(`[Socket] Connected! Socket ID: ${socket.id}`);
      // Optional: Sync time with server
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log(`[Socket] Disconnected`);
    }

    function onGameState(value: GameState) {
      console.log("Received GameState:", value);
      setGameState((prev) => ({ ...prev, ...value }));
    }

    function onRaceStarted(value: GameState) {
      console.log("Race Started Signal:", value);
      setGameState((prev) => ({ ...prev, ...value }));
    }

    function onRaceFinished(value: { winners: (number | string)[] }) {
      setGameState((prev) => ({
        ...prev,
        phase: GamePhase.RESULT,
        winners: value.winners,
      }));
    }

    function onRaceUpdate(data: {
      progress: number;
      speed?: number;
      connectedDevices?: number;
      audienceCount?: number;
      sampledClients?: { luckyNumber: string; taps: number }[];
    }) {
      setGameState((prev) => ({
        ...prev,
        progress: data.progress,
        speed: data.speed,
        connectedDevices: data.connectedDevices,
        audienceCount: data.audienceCount,
        sampledClients: data.sampledClients,
      }));
    }

    function onRaceCountdown(value: GameState & { countdown: number }) {
      console.log(`Race Countdown: ${value.countdown}s`, value);
      setGameState((prev) => ({ ...prev, ...value }));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("gameState", onGameState);
    socket.on("raceCountdown", onRaceCountdown);
    socket.on("raceStarted", onRaceStarted);
    socket.on("raceFinished", onRaceFinished);
    socket.on("raceUpdate", onRaceUpdate);

    // Listen for stats updates (realtime connection counts)
    socket.on(
      "serverStats",
      (stats: {
        connectedDevices: number;
        audienceCount: number;
        luckyNumbers: string[];
      }) => {
        setGameState((prev) => ({
          ...prev,
          connectedDevices: stats.connectedDevices,
          audienceCount: stats.audienceCount,
          connectedUsers: stats.luckyNumbers,
        }));
      },
    );

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Only remove listeners, don't disconnect (socket is shared singleton)
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("gameState", onGameState);
      socket.off("raceCountdown", onRaceCountdown);
      socket.off("raceStarted", onRaceStarted);
      socket.off("raceFinished", onRaceFinished);
      socket.off("raceUpdate", onRaceUpdate);
      socket.off("serverStats");
    };
  }, []);

  return { isConnected, gameState };
}
