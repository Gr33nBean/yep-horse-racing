import { useState } from "react";

interface LuckyNumberFormProps {
  onSubmit: (luckyNumber: string) => void;
}

export function LuckyNumberForm({ onSubmit }: LuckyNumberFormProps) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = number.trim();

    if (!cleanNumber) {
      setError("Please enter your Lucky Number!");
      return;
    }

    if (!/^\d+$/.test(cleanNumber)) {
      setError("Please enter a valid number (digits only)!");
      return;
    }

    const numValue = parseInt(cleanNumber, 10);
    if (numValue <= 0) {
      setError("Please enter a valid positive number!");
      return;
    }

    onSubmit(numValue.toString());
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-yellow-400 text-center">
        Enter Lucky Number
      </h2>
      <p className="text-gray-400 text-center text-sm">
        Enter the number you received at check-in to join the race!
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g. 123"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all placeholder-gray-600"
          autoFocus
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg uppercase tracking-wider shadow-lg transition-transform active:scale-95"
        >
          Join Race
        </button>
      </form>
    </div>
  );
}
