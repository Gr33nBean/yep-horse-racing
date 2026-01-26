import { socket } from "../../services/socket";

export function AudioControl() {
  const controlMusic = (type: "play" | "stop" | "volume", value?: number) => {
    socket.emit("admin:controlMusic", { type, value });
  };

  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-gray-400 text-sm uppercase font-bold mb-4 flex items-center gap-2">
        <span>🔊 Projector Audio</span>
      </h2>

      <div className="space-y-2">
        <label className="text-xs text-gray-400">VOLUME CONTROL</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          onChange={(e) => controlMusic("volume", parseInt(e.target.value))}
          className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 touch-action-none"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </section>
  );
}
