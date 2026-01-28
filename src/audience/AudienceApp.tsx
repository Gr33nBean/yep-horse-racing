import { useGameSync } from "../services/useGameSync";
import { useTapProcessor } from "./hooks/useTapProcessor";
import { useAudienceAuth } from "./hooks/useAudienceAuth";
import { GamePhase } from "../common/types";
import { TapButton } from "./TapButton";
import { LuckyNumberForm } from "./LuckyNumberForm";
import { LoadingScreen } from "./components/LoadingScreen";
import { AudienceHeader } from "./components/AudienceHeader";
import { WaitingScreen } from "./components/WaitingScreen";
import { CountdownScreen } from "./components/CountdownScreen";
import { ResultScreen } from "./components/ResultScreen";

export default function AudienceApp() {
  const { isConnected, gameState } = useGameSync();
  const { handleTap } = useTapProcessor(gameState);
  const { luckyNumber, onLogin, logout } = useAudienceAuth();

  const onTap = () => {
    handleTap();
  };

  // 1. Loading State
  if (!isConnected) {
    return <LoadingScreen onReload={() => window.location.reload()} />;
  }

  // 2. Login State
  if (!luckyNumber) {
    return (
      <div className="flex size-full items-center justify-center bg-gray-900 text-white">
        <LuckyNumberForm onSubmit={onLogin} />
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full bg-gray-900 text-white select-none touch-none relative">
      <AudienceHeader
        luckyNumber={luckyNumber}
        phase={gameState.phase}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {gameState.phase === GamePhase.WAITING && <WaitingScreen />}

        {gameState.phase === GamePhase.COUNTDOWN && <CountdownScreen />}

        {gameState.phase === GamePhase.RACING && (
          <TapButton onTap={onTap} layout={gameState.buttonLayout} />
        )}

        {gameState.phase === GamePhase.RESULT && <ResultScreen />}
      </div>
    </div>
  );
}
