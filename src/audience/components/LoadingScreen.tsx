interface Props {
  onReload: () => void;
}

export function LoadingScreen({ onReload }: Props) {
  return (
    <div className="flex flex-col size-full items-center justify-center bg-gray-900 text-white p-6 text-center space-y-4">
      <div className="animate-spin text-4xl">⏳</div>
      <h2 className="text-xl font-bold">Connecting to Race Server...</h2>
      <p className="text-gray-400 text-sm">
        If this takes too long, please try refreshing the page.
      </p>
      <button
        onClick={onReload}
        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition"
      >
        Reload Page
      </button>
    </div>
  );
}
