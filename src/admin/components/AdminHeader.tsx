interface Props {
  isConnected: boolean;
}

export function AdminHeader({ isConnected }: Props) {
  return (
    <header className="flex justify-between items-center border-b border-gray-800 pb-4">
      <h1 className="text-3xl font-bold text-yellow-500">Admin Control Hub</h1>
      <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded-full">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </div>
    </header>
  );
}
