export const GamePhase = {
  WAITING: "WAITING",
  COUNTDOWN: "COUNTDOWN",
  RACING: "RACING",
  RESULT: "RESULT",
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface Horse {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string; // Optional for now
}

export interface RaceConfig {
  id: string;
  name: string; // e.g. "Giải Ba", "Giải Nhất"
  durationSeconds: number;
  winnerCount: number;
}

export type ButtonLayout = "classic" | "small" | "chaos";

export interface GameState {
  phase: GamePhase;
  currentRaceConfigByLevel?: number; // Level index
  startTime?: number; // Timestamp when race starts
  raceConfigId?: string; // Kept for backwards compatibility if needed
  raceName?: string; // Custom race name
  raceDuration?: number; // Custom duration in seconds
  countdown?: number; // Countdown seconds for UI display
  buttonLayout?: ButtonLayout; // Layout mode for tap buttons
  winners?: (number | string)[];
  progress?: number; // 0-100 (time-based)
  speed?: number; // 0-100 (horse speed based on taps)
  connectedDevices?: number; // Number of connected clients
  audienceCount?: number; // Number of identified players in audience room
  connectedUsers?: string[]; // List of lucky numbers connected
  sampledClients?: { luckyNumber: string; taps: number }[]; // Realtime sample data
  selectedHorseId?: string;
  showResult?: boolean; // Whether to show winner overlay on projector
}
