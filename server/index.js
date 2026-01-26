import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files from dist
app.use(express.static(path.join(__dirname, "../dist")));

// Handle React routing, return all requests to React app
// Handle React routing, return all requests to React app
app.use((req, res) => {
  if (req.method === "GET") {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  } else {
    res.status(404).send("Not found");
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true, // Support older socket.io clients if any
});

// Simple in-memory state
let gameState = {
  phase: "WAITING",
  startTime: null,
  raceConfigId: null,
};

const scores = {}; // socketId -> score
const socketUsers = {}; // socketId -> luckyNumber

// Real-time Race Loop
const TICK_RATE = 100; // 100ms
let raceInterval;

// Race Physics State
let raceProgress = 0; // 0 to 100
let baseSpeed = 0.05; // Base progress per tick
let tapAccumulator = 0; // Taps in current tick

const broadcastStats = () => {
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || [],
  );
  const luckyNumbers = audienceIds
    .map((id) => socketUsers[id])
    .filter(Boolean)
    .sort((a, b) => a - b); // Sort numerically if possible

  const stats = {
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    luckyNumbers,
  };
  io.emit("serverStats", stats);
};

io.on("connection", (socket) => {
  console.log(
    `User connected: ${socket.id}. Total connections: ${io.engine.clientsCount}`,
  );
  broadcastStats();

  // Send current state immediately
  // Note: We need to calculate current audience state for the new connection
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || [],
  );
  const luckyNumbers = audienceIds
    .map((id) => socketUsers[id])
    .filter(Boolean)
    .sort((a, b) => a - b);

  socket.emit("gameState", {
    ...gameState,
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    connectedUsers: luckyNumbers, // Include the list!
  });

  socket.on("identify", ({ luckyNumber }, callback) => {
    socketUsers[socket.id] = luckyNumber;
    socket.join("audience"); // Join audience room
    console.log(
      `Socket ${socket.id} identified as ${luckyNumber} and joined 'audience' room`,
    );

    // Acknowledge success to client
    if (callback) {
      callback({ success: true, socketId: socket.id });
    }

    // Broadcast updated stats (audience count changed)
    broadcastStats();
  });

  // Track last test signal time to prevent spam
  const lastTestSignal = {};

  socket.on("client:testSignal", () => {
    const luckyNumber = socketUsers[socket.id];
    if (!luckyNumber) return;

    const now = Date.now();
    const lastTime = lastTestSignal[socket.id] || 0;

    // Rate limit: 3 seconds per user
    if (now - lastTime < 3000) {
      return;
    }

    lastTestSignal[socket.id] = now;
    console.log(`Test Signal from ${luckyNumber}`);

    // Broadcast only to projector (or everyone, simpler)
    io.emit("server:testSignal", { luckyNumber });
  });

  socket.on("unidentify", () => {
    const luckyNumber = socketUsers[socket.id];
    if (luckyNumber) {
      console.log(`Socket ${socket.id} un-identified (was ${luckyNumber})`);
      delete socketUsers[socket.id];
      delete lastTestSignal[socket.id]; // cleanup
      socket.leave("audience");
      broadcastStats();
    }
  });

  socket.on(
    "admin:startRace",
    ({ name, durationSeconds, buttonLayout = "classic", delaySeconds = 5 }) => {
      const startTime = Date.now() + delaySeconds * 1000;

      // First, broadcast countdown
      gameState = {
        phase: "COUNTDOWN",
        startTime: startTime,
        raceConfigId: "custom", // legacy or placeholder
        raceName: name,
        raceDuration: durationSeconds,
        buttonLayout: buttonLayout,
        winners: [],
      };

      // Clear scores for new race
      for (const k in scores) delete scores[k];

      // Broadcast countdown to everyone
      io.emit("raceCountdown", {
        ...gameState,
        countdown: delaySeconds,
      });

      // Detailed audience logging
      const audienceSocketIds = Array.from(
        io.sockets.adapter.rooms.get("audience") || [],
      );
      const audienceNumbers = audienceSocketIds
        .map((id) => socketUsers[id])
        .filter(Boolean);

      // After delay, actually start the race
      setTimeout(() => {
        gameState.phase = "RACING";

        // Broadcast race started
        io.emit("raceStarted", gameState);
        io.emit("gameState", gameState);

        // Start physics loop
        startRacePhysics(durationSeconds, name);
      }, delaySeconds * 1000);
    },
  );

  socket.on("admin:reset", () => {
    gameState = { phase: "WAITING", startTime: null, raceConfigId: null };
    io.emit("gameState", gameState);
  });

  socket.on("admin:controlMusic", (action) => {
    // action: { type: 'play' | 'stop' | 'volume', value?: number }
    io.emit("projector:controlMusic", action);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete socketUsers[socket.id];
    broadcastStats();
  });

  socket.on("client:taps", ({ count }) => {
    // Validate game phase
    if (gameState.phase !== "RACING") {
      console.log(`Tap rejected: game phase is ${gameState.phase}`);
      return;
    }

    // We store score by luckyNumber if available, or socketId fallback
    const id = socketUsers[socket.id] || socket.id;

    // Update score
    if (!scores[id]) scores[id] = 0;
    scores[id] += count;

    console.log(`Tap received: ${id} +${count} taps (total: ${scores[id]})`);
  });

  // Broadcast leaderboard every 1s during race
  // (Handled by setInterval below)
});

// START RACE HANDLER (Shared across all sockets, but triggered by one)
// Note: This logic needs to be outside the per-socket scope or handled carefully
// to avoid multiple intervals if multiple admins connected (though unlikely for this use case).
// Better approach: Define `startRacePhysics` function.

const startRacePhysics = (durationSeconds, raceName = "Race") => {
  // Reset state
  raceProgress = 0;

  const targetDuration = durationSeconds * 1000; // Convert to ms
  const raceStartTime = Date.now();

  // Horse speed state (visual only)
  let currentSpeed = 0; // 0-100 (percentage)

  console.log(`Starting Race "${raceName}": duration=${targetDuration}ms`);

  if (raceInterval) clearInterval(raceInterval);

  raceInterval = setInterval(() => {
    if (gameState.phase !== "RACING") {
      clearInterval(raceInterval);
      return;
    }

    // Calculate time-based progress (guaranteed to finish on time)
    const elapsed = Date.now() - raceStartTime;
    const timeProgress = Math.min((elapsed / targetDuration) * 100, 100);

    // Sample random clients for tap data (max 5)
    // ONLY sample sockets that have identified as a lucky number (audience)
    const identifiedSocketIds = Object.keys(socketUsers);
    const sampleSize = Math.min(5, identifiedSocketIds.length);
    const sampledSockets = [];

    // Random sampling from identified audience only
    const shuffled = [...identifiedSocketIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < sampleSize; i++) {
      sampledSockets.push(shuffled[i]);
    }

    if (identifiedSocketIds.length === 0) {
      console.log("No identified audience members to sample taps from.");
    }

    // Request taps from sampled clients
    let totalTaps = 0;
    let responsesReceived = 0;
    const individualResponses = {}; // Track per-socket taps

    sampledSockets.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        // Use a timeout for the request to avoid hanging
        socket.timeout(50).emit("requestTaps", {}, (err, response) => {
          if (!err && response && response.taps) {
            totalTaps += response.taps;
            individualResponses[socketId] = response.taps; // Store individually

            const luckyNumber = socketUsers[socketId];
            if (luckyNumber) {
              if (!scores[luckyNumber]) scores[luckyNumber] = 0;
              scores[luckyNumber] += response.taps;
            }
          }
          responsesReceived++;
        });
      }
    });

    // Calculate speed based on taps (after a small delay for responses)
    setTimeout(() => {
      const avgTapsOfSample =
        responsesReceived > 0 ? totalTaps / responsesReceived : 0;

      // avgTapsOfSample is taps per 100ms (tick rate)
      // Convert to Taps Per Second: avgTapsOfSample * 10
      // Assume Max Taps Per Second realistic is ~10-12 taps/sec
      // So target speed (0-100) = (TapsPerSec / 10) * 100

      const targetSpeed = Math.min(avgTapsOfSample * 10 * 10, 100);

      // Apply Smoothing (Inertia) to prevent erratic jumping
      // New Speed = 80% Old Speed + 20% Target Speed
      currentSpeed = currentSpeed * 0.8 + targetSpeed * 0.2;

      // Add random jitter to horse speed for visual variety (only if moving)
      const jitter = currentSpeed > 5 ? (Math.random() - 0.5) * 5 : 0;
      const visualSpeed = Math.max(0, Math.min(100, currentSpeed + jitter));

      // Broadcast progress and speed
      io.emit("raceUpdate", {
        progress: timeProgress,
        speed: visualSpeed,
        connectedDevices: io.engine.clientsCount,
        audienceCount: io.sockets.adapter.rooms.get("audience")?.size || 0,
        sampledClients: sampledSockets.map((sid) => ({
          luckyNumber: socketUsers[sid] || "Unknown",
          taps: individualResponses[sid] || 0, // Use the new variable
        })),
      });
    }, 50); // Small delay to collect responses

    // Check if race duration has elapsed (not based on visual progress)
    if (elapsed >= targetDuration) {
      raceProgress = 100;

      // Determine winner: person with highest tap count
      const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);

      const winner = sortedScores.length > 0 ? [sortedScores[0][0]] : [];

      gameState.phase = "RESULT";
      gameState.winners = winner;

      console.log(
        `Race finished after ${elapsed}ms! Winner: ${winner[0]} with ${sortedScores[0]?.[1] || 0} taps`,
      );

      io.emit("raceFinished", { winners: winner });
      io.emit("gameState", gameState);
      clearInterval(raceInterval);
    }
  }, TICK_RATE);
};

// This block is redundant and causing issues.
// Logic has been moved to the primary connection handler above.

// Broadcast leaderboard every 1s during race
setInterval(() => {
  if (gameState.phase === "RACING") {
    // Sort top 5?
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, score]) => ({ id, score }));

    // Broadcast to 'admin' room only? For now broadcast all or just admin
    io.emit("leaderboard", sorted);
  }
}, 1000);

const PORT = 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket Server running on port ${PORT}`);
});
