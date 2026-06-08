// app/error.tsx
'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <span className="text-6xl">⚠️</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Something went wrong</h2>
        <p className="text-gray-500 mt-2 mb-6 text-sm max-w-sm">{error.message}</p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </main>
  );
}
