// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <span className="text-7xl">⚡</span>
        <h1 className="text-4xl font-bold text-gray-900 mt-4">404</h1>
        <p className="text-gray-500 mt-2 mb-6">This page doesn't exist.</p>
        <Link href="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
