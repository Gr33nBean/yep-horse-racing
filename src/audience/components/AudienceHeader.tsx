import { GamePhase } from "../../common/types";

interface Props {
  luckyNumber: string;
  phase: GamePhase;
  onLogout: () => void;
}

export function AudienceHeader({ luckyNumber, phase, onLogout }: Props) {
  return (
    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
      <div>
        <h1 className="font-bold text-lg">YEP Horse Racing</h1>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">
            Lucky #:{" "}
            <span className="text-yellow-400 font-mono text-base font-bold">
              {luckyNumber}
            </span>
          </p>
          <button
            onClick={onLogout}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-700 text-gray-300 transition-colors"
          >
            EDIT
          </button>
        </div>
      </div>
      <div className="text-sm bg-gray-800 px-3 py-1 rounded-full">{phase}</div>
    </div>
  );
}
