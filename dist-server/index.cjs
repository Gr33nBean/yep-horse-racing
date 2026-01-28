var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.js
var import_express = __toESM(require("express"), 1);
var import_http = require("http");
var import_socket = require("socket.io");
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var CONFIG = {
  PORT: 3e3,
  TICK_RATE: 100,
  // ms between race updates
  COUNTDOWN_SECONDS: 3,
  MIN_SPEED: 15,
  // Minimum horse animation speed
  SPEED_SMOOTHING: 0.8,
  // Inertia factor (0-1)
  TAP_REQUEST_TIMEOUT: 50,
  // ms to wait for tap responses
  SAMPLE_SIZE: 5,
  // Max clients to sample for taps
  TEST_SIGNAL_COOLDOWN: 3e3
  // ms between test signals per user
};
var PHASES = {
  WAITING: "WAITING",
  COUNTDOWN: "COUNTDOWN",
  RACING: "RACING",
  RESULT: "RESULT"
};
var app = (0, import_express.default)();
app.use((0, import_cors.default)());
var DIST_PATH = import_path.default.join(process.cwd(), "dist");
app.use(import_express.default.static(DIST_PATH));
app.use((req, res) => {
  if (req.method === "GET") {
    res.sendFile(import_path.default.join(DIST_PATH, "index.html"));
  } else {
    res.status(404).send("Not found");
  }
});
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 6e4,
  pingInterval: 25e3,
  connectTimeout: 45e3,
  allowEIO3: true
});
var gameState = {
  phase: PHASES.WAITING,
  startTime: null,
  raceConfigId: null
};
var scores = {};
var socketUsers = {};
var lastTestSignal = {};
var raceInterval = null;
var getAudienceInfo = () => {
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || []
  );
  const luckyNumbers = audienceIds.map((id) => socketUsers[id]).filter(Boolean).sort((a, b) => a - b);
  return { audienceIds, luckyNumbers };
};
var broadcastStats = () => {
  const { audienceIds, luckyNumbers } = getAudienceInfo();
  io.emit("serverStats", {
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    luckyNumbers
  });
};
var clearScores = () => {
  for (const k in scores) delete scores[k];
};
var getWinner = () => {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted.length > 0 ? [sorted[0][0]] : [];
};
var sampleAudienceSockets = (count) => {
  const ids = Object.keys(socketUsers);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ids.length));
};
var startRacePhysics = (durationSeconds, raceName = "Race") => {
  const targetDuration = durationSeconds * 1e3;
  const raceStartTime = Date.now();
  let currentSpeed = 0;
  if (raceInterval) clearInterval(raceInterval);
  raceInterval = setInterval(() => {
    if (gameState.phase !== PHASES.RACING) {
      clearInterval(raceInterval);
      return;
    }
    const elapsed = Date.now() - raceStartTime;
    const timeProgress = Math.min(elapsed / targetDuration * 100, 100);
    const sampledSockets = sampleAudienceSockets(CONFIG.SAMPLE_SIZE);
    let totalTaps = 0;
    let responsesReceived = 0;
    const individualResponses = {};
    sampledSockets.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.timeout(CONFIG.TAP_REQUEST_TIMEOUT).emit("requestTaps", {}, (err, response) => {
          if (!err && response?.taps) {
            totalTaps += response.taps;
            individualResponses[socketId] = response.taps;
            const luckyNumber = socketUsers[socketId];
            if (luckyNumber) {
              scores[luckyNumber] = (scores[luckyNumber] || 0) + response.taps;
            }
          }
          responsesReceived++;
        });
      }
    });
    setTimeout(() => {
      const avgTaps = responsesReceived > 0 ? totalTaps / responsesReceived : 0;
      const rawSpeed = avgTaps * 100;
      const targetSpeed = Math.min(Math.max(rawSpeed, CONFIG.MIN_SPEED), 100);
      currentSpeed = currentSpeed * CONFIG.SPEED_SMOOTHING + targetSpeed * (1 - CONFIG.SPEED_SMOOTHING);
      const jitter = currentSpeed > 5 ? (Math.random() - 0.5) * 5 : 0;
      const visualSpeed = Math.max(0, Math.min(100, currentSpeed + jitter));
      io.emit("raceUpdate", {
        progress: timeProgress,
        speed: visualSpeed,
        connectedDevices: io.engine.clientsCount,
        audienceCount: io.sockets.adapter.rooms.get("audience")?.size || 0,
        sampledClients: sampledSockets.map((sid) => ({
          luckyNumber: socketUsers[sid] || "Unknown",
          taps: individualResponses[sid] || 0
        }))
      });
    }, CONFIG.TAP_REQUEST_TIMEOUT);
    if (elapsed >= targetDuration) {
      const winners = getWinner();
      gameState.phase = PHASES.RESULT;
      gameState.winners = winners;
      io.emit("raceFinished", { winners });
      io.emit("gameState", gameState);
      clearInterval(raceInterval);
    }
  }, CONFIG.TICK_RATE);
};
var handleIdentify = (socket) => ({ luckyNumber }, callback) => {
  socketUsers[socket.id] = luckyNumber;
  socket.join("audience");
  if (callback) callback({ success: true, socketId: socket.id });
  broadcastStats();
};
var handleUnidentify = (socket) => () => {
  const luckyNumber = socketUsers[socket.id];
  if (luckyNumber) {
    delete socketUsers[socket.id];
    delete lastTestSignal[socket.id];
    socket.leave("audience");
    broadcastStats();
  }
};
var handleTestSignal = (socket) => () => {
  const luckyNumber = socketUsers[socket.id];
  if (!luckyNumber) return;
  const now = Date.now();
  if (now - (lastTestSignal[socket.id] || 0) < CONFIG.TEST_SIGNAL_COOLDOWN)
    return;
  lastTestSignal[socket.id] = now;
  io.emit("server:testSignal", { luckyNumber });
};
var handleStartRace = ({
  name,
  durationSeconds,
  buttonLayout = "classic",
  selectedHorseId = "1",
  showResult = true
}) => {
  const startTime = Date.now() + CONFIG.COUNTDOWN_SECONDS * 1e3;
  gameState = {
    phase: PHASES.COUNTDOWN,
    startTime,
    raceConfigId: "custom",
    raceName: name,
    raceDuration: durationSeconds,
    buttonLayout,
    winners: [],
    selectedHorseId,
    showResult
  };
  clearScores();
  io.emit("raceCountdown", {
    ...gameState,
    countdown: CONFIG.COUNTDOWN_SECONDS
  });
  setTimeout(() => {
    gameState.phase = PHASES.RACING;
    io.emit("raceStarted", gameState);
    io.emit("gameState", gameState);
    startRacePhysics(durationSeconds, name);
  }, CONFIG.COUNTDOWN_SECONDS * 1e3);
};
var handleReset = () => {
  gameState = { phase: PHASES.WAITING, startTime: null, raceConfigId: null };
  io.emit("gameState", gameState);
};
var handleTaps = (socket) => ({ count }) => {
  if (gameState.phase !== PHASES.RACING) return;
  const id = socketUsers[socket.id] || socket.id;
  scores[id] = (scores[id] || 0) + count;
};
var handleDisconnect = (socket) => () => {
  delete socketUsers[socket.id];
  delete lastTestSignal[socket.id];
  broadcastStats();
};
io.on("connection", (socket) => {
  const { audienceIds, luckyNumbers } = getAudienceInfo();
  socket.emit("gameState", {
    ...gameState,
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    connectedUsers: luckyNumbers
  });
  broadcastStats();
  socket.on("identify", handleIdentify(socket));
  socket.on("unidentify", handleUnidentify(socket));
  socket.on("client:testSignal", handleTestSignal(socket));
  socket.on("client:taps", handleTaps(socket));
  socket.on("disconnect", handleDisconnect(socket));
  socket.on("admin:startRace", handleStartRace);
  socket.on("admin:reset", handleReset);
  socket.on(
    "admin:controlMusic",
    (action) => io.emit("projector:controlMusic", action)
  );
});
setInterval(() => {
  if (gameState.phase === PHASES.RACING) {
    const leaderboard = Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id, score]) => ({ id, score }));
    io.emit("leaderboard", leaderboard);
  }
}, 1e3);
httpServer.listen(CONFIG.PORT, "0.0.0.0", () => {
});
