import { io } from "socket.io-client";

// In dev, Vite is on 5173, Server is on 3000.
// In prod, usually served from same origin if we build to dist and serve via express.
// For YEP offline setup, we might run separate terminals.
// Detect server URL based on the current location
// If accessed via IP (e.g. 192.168.x.x), use that IP for socket connection too
const getSocketURL = () => {
  if (import.meta.env.MODE === "production") {
    return window.location.origin;
  }

  // In development, if we access via IP, use that IP for port 3000
  const hostname = window.location.hostname;
  return `http://${hostname}:3000`;
};

const URL = getSocketURL();

export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});
