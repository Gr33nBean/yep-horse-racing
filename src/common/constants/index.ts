import type { RaceConfig } from "../types";

export const PRIZE_LEVELS: RaceConfig[] = [
  {
    id: "consolation",
    name: "Giải Khuyến Khích",
    durationSeconds: 20,
    winnerCount: 5,
  },
  { id: "third", name: "Giải Ba", durationSeconds: 30, winnerCount: 3 },
  { id: "second", name: "Giải Nhì", durationSeconds: 45, winnerCount: 2 },
  { id: "first", name: "Giải Nhất", durationSeconds: 60, winnerCount: 1 },
];

export const TOTAL_HORSES = 8; // Classic 8 lanes
export const SYNC_INTERVAL_MS = 3000; // Client sends taps every 3s

// Assets Config - Placeholder for future asset changes
export const ASSETS = {
  HORSES: [
    {
      id: "h1",
      name: "Horse 1",
      color: "#FF0000",
      sprite: "/assets/horses/h1.png",
    },
    {
      id: "h2",
      name: "Horse 2",
      color: "#00FF00",
      sprite: "/assets/horses/h2.png",
    },
    // ... extend as needed
  ],
  BG_MUSIC: "/assets/audio/race_bg.mp3",
  SFX_WIN: "/assets/audio/win.mp3",
};
