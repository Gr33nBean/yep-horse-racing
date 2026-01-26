import { useState } from "react";
import { socket } from "../../services/socket";

export function WaitingScreen() {
  const [isCooldown, setIsCooldown] = useState(false);
  const [btnText, setBtnText] = useState("Test My Connection 📶");
  const [btnStyle, setBtnStyle] = useState("");

  const handleTestSignal = () => {
    if (isCooldown) return;

    // UI Feedback
    setIsCooldown(true);
    setBtnText("Signal Sent! 📡");
    setBtnStyle("bg-green-600 scale-95");

    // Emit signal
    socket.emit("client:testSignal");

    // Reset after 3s
    setTimeout(() => {
      setIsCooldown(false);
      setBtnText("Test My Connection 📶");
      setBtnStyle("");
    }, 3000);
  };

  return (
    <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tight">
          Waiting for Race...
        </h2>
        <p className="text-gray-400 font-light text-lg">
          Get your fingers ready!
        </p>
      </div>

      {/* Test Connection Button */}
      <div className="pt-4 border-t border-gray-800/50">
        <button
          onClick={handleTestSignal}
          disabled={isCooldown}
          className={`px-6 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-full text-sm font-bold text-gray-300 border border-gray-700 transition-all shadow-lg transform active:scale-95 ${btnStyle}`}
        >
          {btnText}
        </button>
        <p className="text-[10px] text-gray-500 mt-2 max-w-[200px] mx-auto leading-tight">
          Press to highlight your number on the big screen. Cooldown: 3s.
        </p>
      </div>
    </div>
  );
}
