import { io } from "socket.io-client";

const CLIENT_COUNT = 50; // Simulate 50 concurrent users
const DURATION_MS = 10000; // Run for 10 seconds
const URL = "http://localhost:3000";

console.log(`Starting stress test with ${CLIENT_COUNT} clients...`);

const clients = [];

for (let i = 0; i < CLIENT_COUNT; i++) {
  const socket = io(URL, {
    transports: ["websocket"],
    forceNew: true,
  });

  const luckyNumber = 1000 + i;

  socket.on("connect", () => {
    // console.log(`Client ${i} connected`);
    socket.emit("identify", { luckyNumber });
  });

  socket.on("disconnect", () => {
    // console.log(`Client ${i} disconnected`);
  });

  clients.push({ socket, luckyNumber });
}

// Start spamming taps
console.log("Spamming taps...");
const start = Date.now();

const interval = setInterval(() => {
  if (Date.now() - start > DURATION_MS) {
    clearInterval(interval);
    console.log("Stopping stress test...");
    clients.forEach((c) => c.socket.disconnect());
    return;
  }

  // Random subsets of clients tap
  clients.forEach(({ socket }) => {
    if (Math.random() > 0.5) {
      socket.emit("client:taps", { count: Math.floor(Math.random() * 5) + 1 });
    }
  });
}, 100); // Every 100ms

// Keep process alive
setTimeout(() => {
  console.log("Test finished.");
}, DURATION_MS + 1000);
