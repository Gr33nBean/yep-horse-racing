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
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 6e4,
  pingInterval: 25e3,
  connectTimeout: 45e3,
  allowEIO3: true
  // Support older socket.io clients if any
});
var gameState = {
  phase: "WAITING",
  startTime: null,
  raceConfigId: null
};
var scores = {};
var socketUsers = {};
var TICK_RATE = 100;
var raceInterval;
var raceProgress = 0;
var broadcastStats = () => {
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || []
  );
  const luckyNumbers = audienceIds.map((id) => socketUsers[id]).filter(Boolean).sort((a, b) => a - b);
  const stats = {
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    luckyNumbers
  };
  io.emit("serverStats", stats);
};
io.on("connection", (socket) => {
  broadcastStats();
  const audienceIds = Array.from(
    io.sockets.adapter.rooms.get("audience") || []
  );
  const luckyNumbers = audienceIds.map((id) => socketUsers[id]).filter(Boolean).sort((a, b) => a - b);
  socket.emit("gameState", {
    ...gameState,
    connectedDevices: io.engine.clientsCount,
    audienceCount: audienceIds.length,
    connectedUsers: luckyNumbers
    // Include the list!
  });
  socket.on("identify", ({ luckyNumber }, callback) => {
    socketUsers[socket.id] = luckyNumber;
    socket.join("audience");
    if (callback) {
      callback({ success: true, socketId: socket.id });
    }
    broadcastStats();
  });
  const lastTestSignal = {};
  socket.on("client:testSignal", () => {
    const luckyNumber = socketUsers[socket.id];
    if (!luckyNumber) return;
    const now = Date.now();
    const lastTime = lastTestSignal[socket.id] || 0;
    if (now - lastTime < 3e3) {
      return;
    }
    lastTestSignal[socket.id] = now;
    io.emit("server:testSignal", { luckyNumber });
  });
  socket.on("unidentify", () => {
    const luckyNumber = socketUsers[socket.id];
    if (luckyNumber) {
      delete socketUsers[socket.id];
      delete lastTestSignal[socket.id];
      socket.leave("audience");
      broadcastStats();
    }
  });
  socket.on(
    "admin:startRace",
    ({ name, durationSeconds, buttonLayout = "classic", delaySeconds = 5 }) => {
      const startTime = Date.now() + delaySeconds * 1e3;
      gameState = {
        phase: "COUNTDOWN",
        startTime,
        raceConfigId: "custom",
        // legacy or placeholder
        raceName: name,
        raceDuration: durationSeconds,
        buttonLayout,
        winners: []
      };
      for (const k in scores) delete scores[k];
      io.emit("raceCountdown", {
        ...gameState,
        countdown: delaySeconds
      });
      const audienceSocketIds = Array.from(
        io.sockets.adapter.rooms.get("audience") || []
      );
      const audienceNumbers = audienceSocketIds.map((id) => socketUsers[id]).filter(Boolean);
      setTimeout(() => {
        gameState.phase = "RACING";
        io.emit("raceStarted", gameState);
        io.emit("gameState", gameState);
        startRacePhysics(durationSeconds, name);
      }, delaySeconds * 1e3);
    }
  );
  socket.on("admin:reset", () => {
    gameState = { phase: "WAITING", startTime: null, raceConfigId: null };
    io.emit("gameState", gameState);
  });
  socket.on("admin:controlMusic", (action) => {
    io.emit("projector:controlMusic", action);
  });
  socket.on("disconnect", () => {
    delete socketUsers[socket.id];
    broadcastStats();
  });
  socket.on("client:taps", ({ count }) => {
    if (gameState.phase !== "RACING") {
      return;
    }
    const id = socketUsers[socket.id] || socket.id;
    if (!scores[id]) scores[id] = 0;
    scores[id] += count;
  });
});
var startRacePhysics = (durationSeconds, raceName = "Race") => {
  raceProgress = 0;
  const targetDuration = durationSeconds * 1e3;
  const raceStartTime = Date.now();
  let currentSpeed = 0;
  if (raceInterval) clearInterval(raceInterval);
  raceInterval = setInterval(() => {
    if (gameState.phase !== "RACING") {
      clearInterval(raceInterval);
      return;
    }
    const elapsed = Date.now() - raceStartTime;
    const timeProgress = Math.min(elapsed / targetDuration * 100, 100);
    const identifiedSocketIds = Object.keys(socketUsers);
    const sampleSize = Math.min(5, identifiedSocketIds.length);
    const sampledSockets = [];
    const shuffled = [...identifiedSocketIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < sampleSize; i++) {
      sampledSockets.push(shuffled[i]);
    }
    if (identifiedSocketIds.length === 0) {
    }
    let totalTaps = 0;
    let responsesReceived = 0;
    const individualResponses = {};
    sampledSockets.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.timeout(50).emit("requestTaps", {}, (err, response) => {
          if (!err && response && response.taps) {
            totalTaps += response.taps;
            individualResponses[socketId] = response.taps;
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
    setTimeout(() => {
      const avgTapsOfSample = responsesReceived > 0 ? totalTaps / responsesReceived : 0;
      const targetSpeed = Math.min(avgTapsOfSample * 10 * 10, 100);
      currentSpeed = currentSpeed * 0.8 + targetSpeed * 0.2;
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
          // Use the new variable
        }))
      });
    }, 50);
    if (elapsed >= targetDuration) {
      raceProgress = 100;
      const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
      const winner = sortedScores.length > 0 ? [sortedScores[0][0]] : [];
      gameState.phase = "RESULT";
      gameState.winners = winner;
      io.emit("raceFinished", { winners: winner });
      io.emit("gameState", gameState);
      clearInterval(raceInterval);
    }
  }, TICK_RATE);
};
setInterval(() => {
  if (gameState.phase === "RACING") {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id, score]) => ({ id, score }));
    io.emit("leaderboard", sorted);
  }
}, 1e3);
var PORT = 3e3;
httpServer.listen(PORT, "0.0.0.0", () => {
});
