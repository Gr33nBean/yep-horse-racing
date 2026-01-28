import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  PORT: 3000,
  TICK_RATE: 200, // ms between race updates (200ms = 5 updates/sec, reduces load)
  COUNTDOWN_SECONDS: 3,
  MIN_SPEED: 15, // Minimum horse animation speed
  SPEED_SMOOTHING: 0.8, // Inertia factor (0-1)
  TAP_REQUEST_TIMEOUT: 50, // ms to wait for tap responses
  SAMPLE_SIZE: 5, // Max clients to sample for taps
  TEST_SIGNAL_COOLDOWN: 3000, // ms between test signals per user
};

const PHASES = {
  WAITING: "WAITING",
  COUNTDOWN: "COUNTDOWN",
  RACING: "RACING",
  RESULT: "RESULT",
};

// ============================================================================
// EXPRESS & SOCKET.IO SETUP
// ============================================================================

const app = express();
app.use(cors());

const DIST_PATH = path.join(process.cwd(), "dist");
app.use(express.static(DIST_PATH));

// SPA fallback
app.use((req, res) => {
  if (req.method === "GET") {
    res.sendFile(path.join(DIST_PATH, "index.html"));
  } else {
    res.status(404).send("Not found");
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true,
});

// ============================================================================
// STATE
// ============================================================================

let gameState = {
  phase: PHASES.WAITING,
  startTime: null,
  raceConfigId: null,
};

const scores = {};
const socketUsers = {};
const lastTestSignal = {};

let raceInterval = null;

// ============================================================================
// HELPERS
// ============================================================================

const getAudienceInfo = () => {
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || [],
  );
  const luckyNumbers = audienceIds
    .map((id) => socketUsers[id])
    .filter(Boolean)
    .sort((a, b) => a - b);
  return { audienceIds, luckyNumbers };
};

const broadcastStats = () => {
  const { audienceIds, luckyNumbers } = getAudienceInfo();
  io.emit("serverStats", {
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    luckyNumbers,
  });
};

const clearScores = () => {
  for (const k in scores) delete scores[k];
};

const getWinner = () => {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted.length > 0 ? [sorted[0][0]] : [];
};

const sampleAudienceSockets = (count) => {
  const ids = Object.keys(socketUsers);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ids.length));
};

// ============================================================================
// RACE PHYSICS
// ============================================================================

const startRacePhysics = (durationSeconds, raceName = "Race") => {
  const targetDuration = durationSeconds * 1000;
  const raceStartTime = Date.now();
  let currentSpeed = 0;

  console.log(
    `Starting Race "${raceName}" (Horse: ${gameState.selectedHorseId}): ${durationSeconds}s`,
  );

  if (raceInterval) clearInterval(raceInterval);

  raceInterval = setInterval(() => {
    if (gameState.phase !== PHASES.RACING) {
      clearInterval(raceInterval);
      return;
    }

    const elapsed = Date.now() - raceStartTime;
    const timeProgress = Math.min((elapsed / targetDuration) * 100, 100);

    // Sample audience for tap data (ONLY for speed calculation, NOT for scoring)
    const sampledSockets = sampleAudienceSockets(CONFIG.SAMPLE_SIZE);
    let totalTaps = 0;
    let responsesReceived = 0;
    const individualResponses = {};

    sampledSockets.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket
          .timeout(CONFIG.TAP_REQUEST_TIMEOUT)
          .emit("requestTaps", {}, (err, response) => {
            if (!err && response?.taps) {
              totalTaps += response.taps;
              individualResponses[socketId] = response.taps;
              // NOTE: We do NOT add to scores here
              // Scoring is handled by client:taps event (single source of truth)
            }
            responsesReceived++;
          });
      }
    });

    // Calculate speed after collecting responses
    setTimeout(() => {
      const avgTaps = responsesReceived > 0 ? totalTaps / responsesReceived : 0;
      const rawSpeed = avgTaps * 100; // taps/100ms * 100
      const targetSpeed = Math.min(Math.max(rawSpeed, CONFIG.MIN_SPEED), 100);

      currentSpeed =
        currentSpeed * CONFIG.SPEED_SMOOTHING +
        targetSpeed * (1 - CONFIG.SPEED_SMOOTHING);
      const jitter = currentSpeed > 5 ? (Math.random() - 0.5) * 5 : 0;
      const visualSpeed = Math.max(0, Math.min(100, currentSpeed + jitter));

      io.emit("raceUpdate", {
        progress: timeProgress,
        speed: visualSpeed,
        connectedDevices: io.engine.clientsCount,
        audienceCount: io.sockets.adapter.rooms.get("audience")?.size || 0,
        sampledClients: sampledSockets.map((sid) => ({
          luckyNumber: socketUsers[sid] || "Unknown",
          taps: individualResponses[sid] || 0,
        })),
      });
    }, CONFIG.TAP_REQUEST_TIMEOUT);

    // Check race completion
    if (elapsed >= targetDuration) {
      clearInterval(raceInterval);

      // Change to RESULT phase - this triggers clients to send finalTaps
      gameState.phase = PHASES.RESULT;
      io.emit("gameState", gameState);

      console.log(`Race finished! Collecting final taps...`);

      // Wait 2 seconds for all clients to submit their final taps
      setTimeout(() => {
        const winners = getWinner();
        gameState.winners = winners;

        console.log(`Final results - Winner: ${winners[0] || "None"}`);
        console.log(`All scores:`, scores);

        io.emit("raceFinished", { winners });
        io.emit("gameState", gameState);

        // Broadcast final leaderboard
        const leaderboard = Object.entries(scores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id, score]) => ({ id, score }));
        io.emit("leaderboard", leaderboard);
      }, 2000); // 2 second collection window
    }
  }, CONFIG.TICK_RATE);
};

// ============================================================================
// SOCKET HANDLERS
// ============================================================================

const handleIdentify =
  (socket) =>
    ({ luckyNumber }, callback) => {
      socketUsers[socket.id] = luckyNumber;
      socket.join("audience");
      console.log(`Socket ${socket.id} identified as ${luckyNumber}`);

      if (callback) callback({ success: true, socketId: socket.id });
      broadcastStats();
    };

const handleUnidentify = (socket) => () => {
  const luckyNumber = socketUsers[socket.id];
  if (luckyNumber) {
    console.log(`Socket ${socket.id} un-identified (was ${luckyNumber})`);
    delete socketUsers[socket.id];
    delete lastTestSignal[socket.id];
    socket.leave("audience");
    broadcastStats();
  }
};

const handleTestSignal = (socket) => () => {
  const luckyNumber = socketUsers[socket.id];
  if (!luckyNumber) return;

  const now = Date.now();
  if (now - (lastTestSignal[socket.id] || 0) < CONFIG.TEST_SIGNAL_COOLDOWN)
    return;

  lastTestSignal[socket.id] = now;
  console.log(`Test Signal from ${luckyNumber}`);
  io.emit("server:testSignal", { luckyNumber });
};

const handleStartRace = ({
  name,
  durationSeconds,
  buttonLayout = "classic",
  selectedHorseId = "1",
  showResult = true,
}) => {
  const startTime = Date.now() + CONFIG.COUNTDOWN_SECONDS * 1000;

  gameState = {
    phase: PHASES.COUNTDOWN,
    startTime,
    raceConfigId: "custom",
    raceName: name,
    raceDuration: durationSeconds,
    buttonLayout,
    winners: [],
    selectedHorseId,
    showResult,
  };

  clearScores();
  io.emit("raceCountdown", {
    ...gameState,
    countdown: CONFIG.COUNTDOWN_SECONDS,
  });

  setTimeout(() => {
    gameState.phase = PHASES.RACING;
    io.emit("raceStarted", gameState);
    io.emit("gameState", gameState);
    startRacePhysics(durationSeconds, name);
  }, CONFIG.COUNTDOWN_SECONDS * 1000);
};

const handleReset = () => {
  gameState = { phase: PHASES.WAITING, startTime: null, raceConfigId: null };
  io.emit("gameState", gameState);
};

// Handle final tap count from clients (sent once at race end)
const handleFinalTaps =
  (socket) =>
    ({ count }) => {
      // Only accept final taps during RESULT phase (race just ended)
      if (gameState.phase !== PHASES.RESULT) return;

      const id = socketUsers[socket.id] || socket.id;
      // Only accept if not already recorded
      if (!scores[id]) {
        scores[id] = count;
        console.log(`Final taps from ${id}: ${count}`);
      }
    };

const handleDisconnect = (socket) => () => {
  console.log(`User disconnected: ${socket.id}`);
  delete socketUsers[socket.id];
  delete lastTestSignal[socket.id];
  broadcastStats();
};

// ============================================================================
// SOCKET CONNECTION
// ============================================================================

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}. Total: ${io.engine.clientsCount}`);

  // Send initial state
  const { audienceIds, luckyNumbers } = getAudienceInfo();
  socket.emit("gameState", {
    ...gameState,
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    connectedUsers: luckyNumbers,
  });

  broadcastStats();

  // Register handlers
  socket.on("identify", handleIdentify(socket));
  socket.on("unidentify", handleUnidentify(socket));
  socket.on("client:testSignal", handleTestSignal(socket));
  socket.on("client:finalTaps", handleFinalTaps(socket));
  socket.on("disconnect", handleDisconnect(socket));

  // Admin events
  socket.on("admin:startRace", handleStartRace);
  socket.on("admin:reset", handleReset);
  socket.on("admin:controlMusic", (action) =>
    io.emit("projector:controlMusic", action),
  );
});

// ============================================================================
// PERIODIC BROADCASTS
// ============================================================================

setInterval(() => {
  // Broadcast leaderboard during RACING and RESULT phases
  if (gameState.phase === PHASES.RACING || gameState.phase === PHASES.RESULT) {
    const leaderboard = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, score]) => ({ id, score }));

    io.emit("leaderboard", leaderboard);
  }
}, 1000);

// ============================================================================
// START SERVER
// ============================================================================

httpServer.listen(CONFIG.PORT, "0.0.0.0", () => {
  console.log(`🏇 Horse Racing Server running on port ${CONFIG.PORT}`);
});
