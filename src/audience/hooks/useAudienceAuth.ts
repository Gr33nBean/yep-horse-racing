import { useState, useEffect } from "react";
import { socket } from "../../services/socket";

export function useAudienceAuth() {
  const [luckyNumber, setLuckyNumber] = useState<string | null>(
    localStorage.getItem("luckyNumber"),
  );

  const onLogin = (num: string) => {
    console.log(`[Audience] Manual Login with #: ${num}`);
    localStorage.setItem("luckyNumber", num);
    setLuckyNumber(num);
  };

  const logout = () => {
    if (confirm("Change Lucky Number?")) {
      socket.emit("unidentify");
      localStorage.removeItem("luckyNumber");
      setLuckyNumber(null);
    }
  };

  // Robust Identification Logic
  useEffect(() => {
    if (!luckyNumber) return;

    const identifyUser = () => {
      console.log(`[Audience] Identifying with server as #: ${luckyNumber}...`);
      socket.emit(
        "identify",
        { luckyNumber },
        (response: { success: boolean }) => {
          if (response?.success) {
            console.log(
              `[Audience] ✅ Identification Successful! Ready to play.`,
            );
          } else {
            console.warn(`[Audience] ⚠️ Identification no ack received.`);
          }
        },
      );
    };

    if (socket.connected) {
      identifyUser();
    }

    socket.on("connect", identifyUser);
    return () => {
      socket.off("connect", identifyUser);
    };
  }, [luckyNumber]);

  return { luckyNumber, onLogin, logout };
}
